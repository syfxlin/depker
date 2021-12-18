import { ClientConfig, config, ServerConfig } from "../config/config";
import Dockerode, {
  ContainerCreateOptions,
  ContainerInfo,
  RestartPolicy,
} from "dockerode";
import { docker } from "./api";
import { pack } from "tar-fs";
import { createNetwork, depkerNetwork } from "./network";
import { secret } from "../config/database";
import { dir } from "../config/dir";
import { join } from "path";
import { logger } from "../logger/client";
import { $logger } from "../logger/server";
import { Logger } from "pino";
import { Socket } from "socket.io";

export type CtxProps = {
  folder: string;
  config: ClientConfig;
  socket: Socket;
};

export type PullData = {
  status: string;
  id?: string;
  progressDetail?: {
    current?: number;
    total?: number;
  };
  progress?: string;
};

export type BuildData = {
  // default
  stream?: string;
  // success
  aux?: { ID: string };
  // error
  errorDetail?: {
    code: number;
    message: string;
  };
  error?: string;
};

export default class Ctx {
  public static readonly WAIT_TIME =
    process.env.NODE_ENV === "testing" ? 0 : 10_000;
  public readonly config: ClientConfig;
  public readonly $config: ServerConfig;
  public readonly socket: Socket;
  public readonly folder: string;
  public readonly docker: Dockerode;
  public readonly logger: ReturnType<typeof logger>;
  public readonly $logger: Logger;

  constructor(props: CtxProps) {
    this.config = props.config;
    this.$config = config;
    this.socket = props.socket;
    this.folder = props.folder;
    this.docker = docker;
    this.logger = logger(props.socket);
    this.$logger = $logger;
  }

  public get tag() {
    return `depker-${this.config.name}:latest`;
  }

  public network(name: string) {
    return createNetwork(name);
  }

  public pull(tag: string) {
    this.$logger.debug(`Pull image with tag: ${tag}`);
    this.logger.info(`Pull image with tag: ${tag}`);

    return new Promise<void>((resolve, reject) => {
      this.docker.pull(tag, {}, (error, output: NodeJS.ReadableStream) => {
        if (error) {
          this.$logger.error(`Pull image error with tag: ${this.tag}`, {
            error: error.message,
          });
          this.logger.error(`Pull image error with tag: ${tag}`, {
            error: error.message,
          });
          reject(error);
          return;
        }
        output.on("data", (d) => {
          this.logger.verbose("progress", JSON.parse(d) as PullData);
        });
        output.on("end", () => {
          resolve();
        });
      });
    });
  }

  public build() {
    this.$logger.debug(`Build image with tag: ${this.tag}`);
    this.logger.info(`Build image with tag: ${this.tag}`);

    return new Promise<string>((resolve, reject) => {
      this.docker.buildImage(
        pack(this.folder),
        {
          t: this.tag,
          pull: "true",
        },
        (error, output) => {
          if (error) {
            this.$logger.error(`Build image error with tag: ${this.tag}`, {
              error: error.message,
            });
            this.logger.error(`Build image error with tag: ${this.tag}`, {
              error: error.message,
            });
            reject(error);
            return;
          }
          output?.on("data", (d) => {
            const data = JSON.parse(d) as BuildData;
            if (data.error) {
              this.$logger.error(`Build image error with tag: ${this.tag}`, {
                error: data.error,
              });
              this.logger.error(`Build image error with tag: ${this.tag}`, {
                error: data.error,
              });
              reject(data.error);
              return;
            } else if (data.stream) {
              this.logger.verbose("progress", data);
            }
            // aux and pull image progress skip
          });
          output?.on("end", () => {
            resolve(this.tag);
          });
        }
      );
    });
  }

  // prettier-ignore
  public async start() {
    this.$logger.debug(`Start container with name: ${this.config.name}`);
    this.logger.info(`Start container with name: ${this.config.name}`);

    const containers = await this.docker.listContainers({ all: true });
    const exists = containers.filter(
      (c) => c.Labels["depker.name"] === this.config.name
    );
    const running = exists.find((c) =>
      c.Names.find((n) => n === `/${this.config.name}`)
    );
    const runningContainer =
      running && (await this.docker.getContainer(running.Id));

    // params
    const name = `${this.config.name}-${Date.now()}`;
    const env: Record<string, string> = {
      ...this.config.env,
      DEPKER_NAME: this.config.name,
      DEPKER_ID: name,
    };
    const labels: Record<string, string> = {
      ...this.config.labels,
      "depker.name": this.config.name,
      "depker.id": name,
      "traefik.enable": "true",
      "traefik.docker.network": this.$config.network,
    };
    const middlewares: string[] = this.config.middlewares || [];

    // set domain
    const domain = typeof this.config.domain === "string" ? [this.config.domain] : this.config.domain;
    if (domain) {
      let port = this.config.port;
      if (!port) {
        try {
          const image = await this.docker.getImage(this.tag).inspect();
          const p = Object.keys(image.Config.ExposedPorts)[0];
          port = parseInt(p.split("/")[0]);
          this.$logger.debug(`Detected deployment port: ${port}`);
          this.logger.verbose(`Detected deployment port: ${port}`);
        } catch {
          port = 80;
        }
      }
      const rule = domain.map((d) => `Host(\`${d}\`)`).join(" || ");
      labels[`traefik.http.routers.${name}.rule`] = rule;
      labels[`traefik.http.routers.${name}-web.rule`] = rule;
      labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port);
    }

    // set https
    if (this.config.letsencrypt) {
      labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = "https";
      labels[`traefik.http.routers.${name}.tls.certresolver`] = "depkerChallenge";
      labels[`traefik.http.routers.${name}.entrypoints`] = "websecure";
      // redirect http to https
      labels[`traefik.http.middlewares.${name}-redirect.redirectscheme.scheme`] = "https";
      labels[`traefik.http.routers.${name}-web.entrypoints`] = "web";
      labels[`traefik.http.routers.${name}-web.middlewares`] = `${name}-redirect@docker`;
      middlewares.push(`${name}-https@docker`);
    }

    // gzip
    if (this.config.gzip) {
      labels[`traefik.http.middlewares.${name}-compress.compress`] = "true";
      middlewares.push(`${name}-compress@docker`);
    }

    // rateLimit
    if (this.config.rateLimit) {
      labels[`traefik.http.middlewares.${name}-rate.ratelimit.average`] = String(this.config.rateLimit.average);
      labels[`traefik.http.middlewares.${name}-rate.ratelimit.burst`] = String(this.config.rateLimit.burst);
      middlewares.push(`${name}-rate@docker`);
    }

    // basic auth
    if (this.config.basicAuth) {
      labels[`traefik.http.middlewares.${name}-auth.basicauth.users`] = this.config.basicAuth;
      middlewares.push(`${name}-auth@docker`);
    }

    // push middlewares to labels
    if (middlewares.length) {
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares),].join(",");
    }

    // de-secret env and labels
    const Env = Object.entries(env).map(([key, value]) => {
      return `${key}=${secret(value)}`;
    });
    const Labels = Object.entries(labels).reduce(
      (all, [key, value]) => ({
        ...all,
        [key]: secret(value),
      }),
      {} as Record<string, string>
    );

    // set restart policy
    const rp = this.config.restart || "on-failure:2";
    const _RestartPolicy: RestartPolicy = {
      Name: rp,
    };
    if (rp.startsWith("on-failure")) {
      _RestartPolicy.Name = "on-failure";
      try {
        _RestartPolicy.MaximumRetryCount = parseInt(rp.split(":")[1]);
      } catch {
        _RestartPolicy.MaximumRetryCount = 2;
      }
    }

    // set volumes
    const volumes = this.config.volumes?.map((vol) => {
      if (vol.startsWith("@/")) {
        vol = join(dir.storage, vol.substring(2));
      }
      // TODO: remove windows hook
      return vol
        .replace(/\\/g, "/")
        .replace(/^(\w):/, ($0, $1) => `/mnt/${$1.toLowerCase()}`);
    });

    // set ports
    const ports = this.config.ports?.reduce((all, port) => {
      const [$0, $1, $2] = port.split(":");
      const [$port, $protocol = "tcp"] = ($2 ?? $1).split("/");
      if ($2) {
        return {
          ...all,
          [`${$port}/${$protocol}`]: [{ HostPort: $1, HostIp: $0 }],
        };
      } else if ($1) {
        return {
          ...all,
          [`${$port}/${$protocol}`]: [{ HostPort: $0 }],
        };
      }
      return all;
    }, {});

    const options: ContainerCreateOptions = {
      name,
      Image: this.tag,
      Labels,
      Env,
      ExposedPorts: {
        ...Object.entries(ports || {}).reduce((all, [key]) => ({
          ...all,
          [key]: {}
        }), {})
      },
      HostConfig: {
        PortBindings: ports,
        Binds: volumes,
        RestartPolicy: _RestartPolicy,
      },
    };

    // create container
    const container = await docker.createContainer(options);

    // networks
    const dn = await depkerNetwork();
    await dn.connect({
      Container: container.id,
    });
    if (this.config.network) {
      await Promise.all(
        this.config.network.map(async (name) => {
          const network = await createNetwork(name);
          await network.connect({
            Container: container.id,
          });
        })
      );
    }

    // if define ports, must down running service
    if (ports && runningContainer) {
      await runningContainer.stop();
    }

    try {
      // start new container
      await container.start();

      // rename running, zero downtime update
      if (runningContainer) {
        const rename = `${this.config.name}-${Date.now()}-rename`;
        this.$logger.debug(`Found previous container named ${this.config.name} (${runningContainer.id.substring(0, 10)}), renaming to ${rename}`);
        this.logger.info(`Found previous container named ${this.config.name} (${runningContainer.id.substring(0, 10)}), renaming to ${rename}`);
        await runningContainer.rename({ name: rename });
      }

      // rename container to project name
      this.$logger.debug(`Renaming ${name} (${container.id.substring(0, 10)}) to ${this.config.name}`);
      this.logger.info(`Renaming ${name} (${container.id.substring(0, 10)}) to ${this.config.name}`);
      await container.rename({ name: this.config.name });

      // clean
      await this.clean(exists);
    } catch (e) {
      // restart old container
      await runningContainer?.start();
    }
  }

  public clean(containers: ContainerInfo[]) {
    this.$logger.debug(`Shutting down old containers in ${Ctx.WAIT_TIME}ms`);
    this.logger.info(`Shutting down old containers in ${Ctx.WAIT_TIME}ms`);
    process.nextTick(async () => {
      // wait timeout
      await new Promise((resolve) => setTimeout(resolve, Ctx.WAIT_TIME));
      // remove all not used
      await Promise.all(
        containers.map(async (info) => {
          const container = await docker.getContainer(info.Id);
          try {
            await container.remove({ force: true });
          } catch (e: any) {
            if (e.statusCode === 404) {
              return;
            }
            throw e;
          }
        })
      );
    });

    if (this.$config.autoprune) {
      // prune
      process.nextTick(async () => {
        await Promise.all([docker.pruneImages(), docker.pruneVolumes()]);
      });
    }
  }
}
