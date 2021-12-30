import { ClientConfig, config, ServerConfig } from "../config/config";
import {
  ContainerCreateOptions,
  ContainerInfo,
  RestartPolicy,
} from "dockerode";
import { Docker, docker } from "./api";
import { pack } from "tar-fs";
import { secret } from "../config/database";
import { dir } from "../config/dir";
import { join } from "path";
import { log } from "../logger/client";
import { logger } from "../logger/server";
import { Logger } from "pino";
import fs from "fs-extra";

export type CtxProps<C extends ClientConfig = ClientConfig> = {
  folder: string;
  config: C;
  logger: ReturnType<typeof log>;
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

export type BuildProps = {
  name: string;
  stream: NodeJS.ReadableStream;
  args?: Record<string, string>;
};

export type StartProps = {
  tag?: string;
  name: string;
  env?: Record<string, string>;
  labels?: Record<string, string>;
  middlewares?: string[];
  domain?: string | string[];
  port?: number;
  letsencrypt?: boolean;
  gzip?: boolean;
  rate_limit?: {
    average: number;
    burst: number;
  };
  basic_auth?: string;
  restart?:
    | "no"
    | "on-failure"
    | "unless-stopped"
    | "always"
    | `on-failure:${string}`;
  volumes?: string[];
  ports?: string[];
  networks?: string[];
};

export default class Ctx<C extends ClientConfig = ClientConfig> {
  public static readonly WAIT_TIME =
    process.env.NODE_ENV === "testing" ? 0 : 10_000;
  public readonly config: C;
  public readonly $config: ServerConfig;
  public readonly folder: string;
  public readonly docker: Docker;
  public readonly logger: ReturnType<typeof log>;
  public readonly $logger: Logger;

  constructor(props: CtxProps<C>) {
    this.config = props.config;
    this.folder = props.folder;
    this.logger = props.logger;
    this.$config = config;
    this.docker = docker;
    this.$logger = logger;
  }

  public network(name: string) {
    return this.docker.initNetwork(name);
  }

  public pull(tag: string) {
    this.$logger.debug(`Pull image with tag: ${tag}`);
    this.logger.info(`Pull image with tag: ${tag}`);

    return new Promise<void>((resolve, reject) => {
      this.docker.pull(tag, {}, (error, output: NodeJS.ReadableStream) => {
        if (error) {
          this.$logger.error(`Pull image error with tag: ${tag}`, {
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
    if (this.config.env_file) {
      const env = Object.entries({
        ...this.config.env,
        DEPKER_NAME: this.config.name,
      })
        .map(([key, value]) => `${key}=${secret(value)}`)
        .join("\n");
      try {
        fs.outputFileSync(join(this.folder, this.config.env_file), env);
      } catch (e) {
        const error = e as Error;
        this.$logger.error(
          `Write env file error with name: ${this.config.name}`,
          {
            error: error.message,
          }
        );
        this.logger.error(
          `Write env file error with name: ${this.config.name}`,
          {
            error: error.message,
          }
        );
        return Promise.reject(e);
      }
    }

    return this.buildAs({
      name: this.config.name,
      stream: pack(this.folder),
    });
  }

  public buildAs(props: BuildProps) {
    const tag = `depker-${props.name}:latest`;
    this.$logger.debug(`Build image with tag: ${tag}`);
    this.logger.info(`Build image with tag: ${tag}`);

    return new Promise<string>(async (resolve, reject) => {
      // build image
      this.docker.buildImage(
        props.stream,
        {
          t: tag,
          pull: "true",
          buildargs: props.args,
        },
        (error, output) => {
          if (error) {
            this.$logger.error(`Build image error with tag: ${tag}`, {
              error: error.message,
            });
            this.logger.error(`Build image error with tag: ${tag}`, {
              error: error.message,
            });
            reject(error);
            return;
          }
          output?.on("data", (d) => {
            const data = JSON.parse(d) as BuildData;
            if (data.error) {
              this.$logger.error(`Build image error with tag: ${tag}`, {
                error: data.error,
              });
              this.logger.error(`Build image error with tag: ${tag}`, {
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
            resolve(tag);
          });
        }
      );
    });
  }

  public async start() {
    return this.startAt(this.config);
  }

  // prettier-ignore
  public async startAt(props: StartProps) {
    this.$logger.debug(`Start container with name: ${props.name}`);
    this.logger.info(`Start container with name: ${props.name}`);

    const containerInfos = await this.docker.listContainers({ all: true });
    const existInfos = containerInfos.filter(c => c.Labels["depker.name"] === props.name);
    const runningInfo = existInfos.find(c => c.Names.find(n => n === `/${props.name}`));
    const running = runningInfo && await docker.getContainer(runningInfo.Id);

    // params
    const name = `${props.name}-${Date.now()}`;
    const tag = props.tag ?? `depker-${props.name}:latest`;
    const domain = typeof props.domain === "string" ? [props.domain] : props.domain;
    const env: Record<string, string> = {
      ...props.env,
      DEPKER_NAME: props.name,
      DEPKER_ID: name,
    };
    const labels: Record<string, string> = {
      ...props.labels,
      "depker.name": props.name,
      "depker.id": name,
      "traefik.enable": "true",
      "traefik.docker.network": this.$config.network,
    };
    const middlewares: string[] = props.middlewares ?? [];
    
    // set domain
    if (domain) {
      let port = props.port;
      if (!port) {
        try {
          const image = await this.docker.getImage(tag).inspect();
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
    if (props.letsencrypt) {
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
    if (props.gzip) {
      labels[`traefik.http.middlewares.${name}-compress.compress`] = "true";
      middlewares.push(`${name}-compress@docker`);
    }

    // rateLimit
    if (props.rate_limit) {
      labels[`traefik.http.middlewares.${name}-rate.ratelimit.average`] = String(props.rate_limit.average);
      labels[`traefik.http.middlewares.${name}-rate.ratelimit.burst`] = String(props.rate_limit.burst);
      middlewares.push(`${name}-rate@docker`);
    }

    // basic auth
    if (props.basic_auth) {
      labels[`traefik.http.middlewares.${name}-auth.basicauth.users`] = props.basic_auth;
      middlewares.push(`${name}-auth@docker`);
    }

    // push middlewares to labels
    if (middlewares.length) {
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares),].join(",");
    }

    // de-secret env and labels
    const Env = Object.entries(env).map(([key, value]) => `${key}=${secret(value)}`);
    const Labels = Object.entries(labels).reduce(
      (all, [key, value]) => ({
        ...all,
        [key]: secret(value),
      }),
      {} as Record<string, string>
    );

    // set restart policy
    const rp = props.restart || "on-failure:2";
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
    const volumes = props.volumes?.map((vol) => {
      if (vol.startsWith("@/")) {
        vol = join(dir.storage, vol.substring(2));
      }
      // TODO: remove windows hook
      return vol
        .replace(/\\/g, "/")
        .replace(/^(\w):/, ($0, $1) => `/mnt/${$1.toLowerCase()}`);
    });

    // set ports
    const ports = props.ports?.reduce((all, port) => {
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
      Image: tag,
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
    const dn = await this.docker.depkerNetwork();
    await dn.connect({
      Container: container.id,
    });
    if (props.networks) {
      await Promise.all(
        props.networks.map(async (name) => {
          const network = await this.docker.initNetwork(name);
          await network.connect({
            Container: container.id,
          });
        })
      );
    }

    // if define ports, must down running service
    if (ports && running) {
      await running.stop();
    }

    try {
      // start new container
      await container.start();

      // rename running, zero downtime update
      if (running) {
        const rename = `${props.name}-${Date.now()}-rename`;
        this.$logger.debug(`Found previous container named ${props.name} (${running.id.substring(0, 10)}), renaming to ${rename}`);
        this.logger.info(`Found previous container named ${props.name} (${running.id.substring(0, 10)}), renaming to ${rename}`);
        await running.rename({ name: rename });
      }

      // rename container to project name
      this.$logger.debug(`Renaming ${name} (${container.id.substring(0, 10)}) to ${props.name}`);
      this.logger.info(`Renaming ${name} (${container.id.substring(0, 10)}) to ${props.name}`);
      await container.rename({ name: props.name });

      // clean
      await this.clean(existInfos);
    } catch (e) {
      // restart old container
      await running?.start();
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

  public dockerfile(data: any) {
    fs.outputFileSync(join(this.folder, "Dockerfile"), data, "utf-8");
  }

  public existsFile(path: string) {
    return fs.pathExistsSync(join(this.folder, path));
  }

  public writeFile(path: string, data: any, overwrite?: boolean) {
    const _path = join(this.folder, path);
    if (overwrite !== false || !fs.pathExistsSync(_path)) {
      fs.outputFileSync(_path, data, "utf-8");
    }
  }

  public readFile(path: string) {
    return fs.readFileSync(path).toString("utf-8");
  }
}
