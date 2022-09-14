import { Injectable, OnModuleInit } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "./storage.service";
import { PassThrough } from "stream";
import { createInterface } from "readline";
import { DEPKER_CERT, DEPKER_NETWORK, DOCKER_IMAGE, LINUX_DIR, ROOT_DIR } from "../constants/depker.constant";
import { ContainerCreateOptions } from "dockerode";
import path from "path";
import { DeployLogRepository } from "../repositories/deploy-log.repository";
import { DeployRepository } from "../repositories/deploy.repository";

@Injectable()
export class DeployService implements OnModuleInit {
  constructor(
    private readonly dockerService: DockerService,
    private readonly deployRepository: DeployRepository,
    private readonly logRepository: DeployLogRepository,
    private readonly storageService: StorageService
  ) {}

  public async deploy(deploy: Deploy) {
    await this.build(deploy);
  }

  public async build(deploy: Deploy) {
    const app = deploy.app;
    const tag = `depker-${app.name}:${deploy.id}`;

    // logger
    await this.logRepository.step(deploy, `Building image ${tag} started.`);

    // commands
    const commands: string[] = [`DOCKER_BUILDKIT=1`, `docker`, `build`, `--tag=${tag}`];
    if (app.pull) {
      commands.push(`--pull`);
    }
    if (deploy.force) {
      commands.push(`--no-cache`);
    }
    for (const [k, v] of Object.entries(app.buildArgs)) {
      commands.push(`--build-arg=${k}=${v}`);
    }
    for (const v of app.labels) {
      commands.push(`--label=${v.name}=${v.value}`);
    }
    for (const v of app.hosts) {
      commands.push(`--add-host=${v.name}:${v.value}`);
    }
    commands.push(`--secret=id=secrets,src=/sec`);
    commands.push(`.`);

    // checkout code
    // prettier-ignore
    const secrets = app.secrets.filter(s => s.onbuild).map(s => `${s.name}=${s.value}`).join("\n");
    const dir = await this.storageService.project(deploy);
    const sec = await this.storageService.file(deploy, "secret", `${secrets}\n`);

    // output
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => {
      this.logRepository.log(deploy, line);
    });

    // build image
    await this.dockerService.pullImage(DOCKER_IMAGE);
    const [result] = await this.dockerService.run(DOCKER_IMAGE, [`sh`, `-c`, commands.join(" ")], through, {
      WorkingDir: "/app",
      HostConfig: {
        AutoRemove: true,
        Binds: [`${LINUX_DIR(sec)}:/sec`, `${LINUX_DIR(dir)}:/app`, `/var/run/docker.sock:/var/run/docker.sock`],
      },
    });
    if (result.StatusCode === 0) {
      await this.logRepository.succeed(deploy, `Building image ${tag} successful.`);
      return true;
    } else {
      await this.logRepository.failed(deploy, `Building image ${tag} failure.`);
      return false;
    }
  }

  public async start(deploy: Deploy) {
    const app = deploy.app;

    // logger
    await this.logRepository.step(deploy, `Deployment container ${app.name} started.`);

    // parameters
    const id = String(deploy.id);
    const name = app.name;
    const commit = deploy.commit;

    // create options
    const options: ContainerCreateOptions = {
      name: `${name}-${id}-${Date.now()}`,
      Image: `depker-${name}:${id}`,
      Env: Object.entries({
        ...app.secrets.reduce((a, v) => ({ ...a, [v.name]: v.value }), {}),
        DEPKER_NAME: name,
        DEPKER_ID: id,
        DEPKER_COMMIT: commit,
      }).map(([k, v]) => `${k}=${v}`),
      Labels: {
        ...app.labels.reduce((a, v) => ({ ...a, [v.name]: v.value }), {}),
        "depker.name": name,
        "depker.id": id,
        "depker.commit": commit,
        "traefik.enable": "true",
        "traefik.docker.network": DEPKER_NETWORK,
      },
      HostConfig: {
        Binds: [],
      },
    };

    if (app.commands.length) {
      options.Cmd = app.commands;
    }
    if (app.entrypoints.length) {
      options.Entrypoint = app.entrypoints;
    }
    if (app.restart && options.HostConfig) {
      const [name, retry] = app.restart.split(":");
      options.HostConfig.RestartPolicy = {
        Name: name,
        MaximumRetryCount: parseInt(retry),
      };
    }
    if (app.init && options.HostConfig) {
      options.HostConfig.Init = true;
    }
    if (app.rm && options.HostConfig) {
      options.HostConfig.AutoRemove = true;
    }
    if (app.privileged && options.HostConfig) {
      options.HostConfig.Privileged = true;
    }
    if (app.user) {
      options.User = app.user;
    }
    if (app.workdir) {
      options.WorkingDir = app.workdir;
    }
    if (app.hosts.length && options.HostConfig) {
      options.HostConfig.ExtraHosts = app.hosts.map((h) => `${h.name}:${h.value}`);
    }
    if (app.healthcheck.cmd) {
      options.Healthcheck = {
        Test: app.healthcheck.cmd,
        Retries: app.healthcheck.retries,
        Interval: app.healthcheck.interval,
        StartPeriod: app.healthcheck.start,
        Timeout: app.healthcheck.timeout,
      };
    }

    // web
    if (app.rule || app.domain.length) {
      const rule = app.rule || app.domain.map((d) => `Host(\`${d}\`)`).join(" || ");
      const port = app.port;
      const scheme = app.scheme;
      const middlewares: string[] = [];
      const labels = options.Labels as Record<string, string>;

      // service
      labels[`traefik.http.routers.${name}.service`] = name;
      labels[`traefik.http.services.${name}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port);

      // route
      if (app.tls) {
        // https
        labels[`traefik.http.routers.${name}.rule`] = rule;
        labels[`traefik.http.routers.${name}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}.tls.certresolver`] = DEPKER_CERT;
        // http
        labels[`traefik.http.routers.${name}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${name}-http.middlewares`] = name + "-https";
        labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = "https";
      } else {
        // http
        labels[`traefik.http.routers.${name}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of app.middlewares) {
        for (const [k, v] of Object.entries(middleware.options)) {
          labels[`traefik.http.middlewares.${name}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    for (const expose of app.exposes) {
      const protocol = expose.protocol;
      const src = expose.src;
      const dst = expose.dst;
      const labels = options.Labels as Record<string, string>;
      labels[`traefik.${protocol}.services.${name}-${protocol}-${src}.loadbalancer.server.port`] = String(dst);
      labels[`traefik.${protocol}.routers.${name}-${protocol}-${src}.entrypoints`] = `${protocol}${src}`;
      labels[`traefik.${protocol}.routers.${name}-${protocol}-${src}.service`] = `${name}-${protocol}-${src}`;
    }

    // volumes
    for (const volume of app.volumes) {
      const binds = options.HostConfig?.Binds as string[];
      const value = `${volume.src}:${volume.dst}:${volume.readonly ? "ro" : "rw"}`;
      binds.push(value.startsWith("@/") ? path.posix.join(ROOT_DIR, value.substring(2)) : value);
    }

    // create container
    const container = await this.dockerService.createContainer(options);

    // networks
    const dn = await this.dockerService.depkerNetwork();
    await dn.connect({ Container: container.id });
    for (const network in app.networks) {
      const dn = await this.dockerService.initNetwork(network);
      await dn.connect({ Container: container.id });
    }

    try {
      // if not rolling deployment, remove old containers
      if (!app.rolling) {
        await this.purge(deploy);
      }

      // start new container
      await container.start();

      // TODO: check container is up

      // if rolling deployment, remove old containers
      if (app.rolling) {
        await this.purge(deploy);
      }
      await this.logRepository.succeed(deploy, `Deployment container ${app.name} successful.`);
      return true;
    } catch (e) {
      await this.logRepository.failed(deploy, `Deployment container ${app.name} failure.`);
      return false;
    }
  }

  public async purge(deploy: Deploy) {
    await this.logRepository.log(deploy, `Purge old ${deploy.app.name} containers.`);
    process.nextTick(async () => {
      // wait timeout
      await new Promise((resolve) => setTimeout(resolve, 60000));
      // remove all not used
      const containerInfos = await this.dockerService.listContainers({ all: true });
      // prettier-ignore
      // eslint-disable-next-line max-len
      const appInfos = containerInfos.filter((c) => c.Labels["depker.name"] === deploy.app.name).filter((c) => c.Labels["depker.id"] !== String(deploy.id));
      const apps = appInfos.map((c) => this.dockerService.getContainer(c.Id));
      for (const app of apps) {
        try {
          await app.remove({ force: true });
        } catch (e: any) {
          if (e.statusCode === 404) {
            return;
          }
          await this.logRepository.failed(deploy, `Purge container ${app.id} failed. ${e}`);
        }
      }
    });
  }

  async onModuleInit() {
    const build = await this.deployRepository.findOne({
      where: {
        id: 1,
      },
      relations: {
        app: {
          volumes: true,
          exposes: true,
        },
      },
    });
    if (!build) {
      return;
    }
    await this.deploy(build);
  }
}
