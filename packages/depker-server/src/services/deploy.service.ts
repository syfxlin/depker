import { Injectable } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "./storage.service";
import { In, LessThan, Not } from "typeorm";
import pAll from "p-all";
import { PluginService } from "./plugin.service";
import { PackContext } from "../plugins/pack.context";
import { Setting } from "../entities/setting.entity";
import { DeployLogger } from "../entities/log.entity";
import { IMAGES, NAMES, PATHS } from "../constants/depker.constant";
import { ContainerCreateOptions } from "dockerode";
import path from "path";
import {
  ServiceHealthCheck,
  ServiceMiddleware,
  ServicePort,
  ServiceRestart,
  ServiceVolume,
} from "../entities/service.entity";
import fs from "fs-extra";
import { PassThrough } from "stream";
import { createInterface } from "readline";
import { ModuleRef } from "@nestjs/core";

export interface DeployBuildOptions {
  // options
  pull?: boolean;
  cache?: boolean;
  // values
  args?: Record<string, string>;
  hosts?: Record<string, string>;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
}

export interface DeployStartOptions {
  // values
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  ports?: Array<ServicePort>;
  volumes?: Array<ServiceVolume>;
  hosts?: Record<string, string>;
  networks?: Record<string, string>;
  // extensions
  commands?: string[];
  entrypoints?: string[];
  restart?: ServiceRestart;
  healthcheck?: ServiceHealthCheck;
  init?: boolean;
  rm?: boolean;
  privileged?: boolean;
  user?: string;
  workdir?: string;
  // web
  domain?: string[];
  rule?: string;
  port?: number;
  scheme?: string;
  tls?: boolean;
  middlewares?: ServiceMiddleware[];
}

@Injectable()
export class DeployService {
  constructor(
    private readonly docker: DockerService,
    private readonly storages: StorageService,
    private readonly plugins: PluginService,
    private readonly ref: ModuleRef
  ) {}

  public async task() {
    const setting = await Setting.read();
    const deploys = await Deploy.find({
      where: {
        status: In(["queued", "running"]),
      },
      order: {
        createdAt: "asc",
      },
      relations: {
        service: true,
      },
    });

    if (!deploys.length) {
      return;
    }

    const actions = deploys.map((deploy) => async () => {
      const service = deploy.service;
      const logger = deploy.logger;
      try {
        // if status equal running, explain that deploy is interrupted during execution, restart
        if (deploy.status === "running") {
          await logger.step(`Building halted, restarting...`);
        }

        // stop old deploys
        if (setting.concurrency === 1) {
          await Deploy.update(
            {
              service: {
                name: Not(service.name),
              },
              id: Not(deploy.id),
              status: In(["queued", "running"]),
              createdAt: LessThan(new Date(Date.now() - 10 * 1000)),
            },
            {
              status: "failed",
            }
          );
        }

        // log started
        await logger.step(`Deployment service ${service.name} started.`);

        // update status to running
        await Deploy.update(deploy.id, { status: "running" });

        // deploy container
        await this.deploy(deploy);

        // purge containers
        await this.purge(deploy);

        // update status to success
        await Deploy.update(deploy.id, { status: "success" });

        // log successful
        await logger.success(`Deployment service ${service.name} successful.`);
      } catch (e: any) {
        // update status to failed
        await Deploy.update(
          {
            id: deploy.id,
            status: In(["queued", "running"]),
          },
          {
            status: "failed",
          }
        );

        // save failed logs
        await logger.error(`Deployment service ${service.name} failure. Caused by ${e}.`);
      }
    });

    await pAll(actions, { concurrency: setting.concurrency });
  }

  public async deploy(deploy: Deploy) {
    // values
    const service = deploy.service;

    // find buildpack
    const buildpack = (await this.plugins.buildpacks())[service.buildpack];
    if (!buildpack?.buildpack?.handler) {
      throw new Error(`Not found buildpack ${service.buildpack}`);
    }

    // init project
    const project = await this.storages.project(service.name, deploy.target);

    // init context
    const context = new PackContext({
      name: buildpack.name,
      deploy: deploy,
      project: project,
      ref: this.ref,
    });

    // deployment containers
    await buildpack.buildpack.handler(context);
  }

  public async purge(deploy: Deploy) {
    // values
    const service = deploy.service;
    const logger = deploy.logger;

    // logger
    await logger.step(`Purge ${service.name} containers started.`);

    // purge container
    const infos = await this.docker.listContainers({ all: true });
    const containers = infos.filter(
      (c) => c.Labels["depker.name"] === service.name && !c.Names.includes(`/${service.name}`)
    );
    for (const info of containers) {
      const container = this.docker.getContainer(info.Id);
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        if (e.statusCode === 404) {
          return;
        }
        await logger.error(`Purge container ${container.id} failed.`, e);
      }
    }

    // purge images and volumes
    process.nextTick(async () => {
      const setting = await Setting.read();
      if (setting.purge) {
        await Promise.all([this.docker.pruneImages(), this.docker.pruneVolumes()]);
      }
    });
  }

  public async build(name: string, project: string, logger: DeployLogger, options: DeployBuildOptions) {
    const image = `depker-${name}:${Date.now()}`;

    // logger
    await logger.step(`Building image ${image} started.`);

    // commands
    const commands: string[] = [`DOCKER_BUILDKIT=1`, `docker`, `build`, `--progress=plain`, `--tag=${image}`];

    // options
    if (options.pull) {
      commands.push(`--pull`);
    }
    if (options.cache) {
      commands.push(`--no-cache`);
    }

    // args
    for (const [name, value] of Object.entries(options.args ?? {})) {
      commands.push(`--build-arg=${name}=${value}`);
    }

    // hosts
    for (const [name, value] of Object.entries(options.hosts ?? {})) {
      commands.push(`--add-host=${name}=${value}`);
    }

    // labels
    for (const [name, value] of Object.entries(options.labels ?? {})) {
      commands.push(`--label=${name}=${value}`);
    }

    // secrets
    const secrets = await this.storages.file(name);
    // prettier-ignore
    fs.outputFileSync(secrets, Object.entries(options.secrets ?? {}).map(([name, value]) => `${name}=${value}\n`).join(""));

    // project
    commands.push(".");

    // output
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => {
      logger.log(line);
    });

    // build image
    await this.docker.pullImage(IMAGES.DOCKER);
    const [result] = await this.docker.run(IMAGES.DOCKER, [`sh`, `-c`, commands.join(" ")], through, {
      WorkingDir: "/project",
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${PATHS.LINUX(project)}:/project`,
          `${PATHS.LINUX(secrets)}:/secrets`,
          `/var/run/docker.sock:/var/run/docker.sock`,
        ],
      },
    });
    if (result.StatusCode === 0) {
      await logger.success(`Building image ${image} successful.`);
      return image;
    } else {
      await logger.error(`Building image ${image} failure.`);
      throw new Error(`Build image ${image} failure.`);
    }
  }

  public async start(name: string, image: string, logger: DeployLogger, options: DeployStartOptions) {
    // logger
    await logger.step(`Start container ${name} started.`);

    // args
    const envs: Record<string, string> = {
      ...options.secrets,
      DEPKER_NAME: name,
    };
    const labels: Record<string, string> = {
      ...options.labels,
      "depker.name": name,
      "traefik.enable": "true",
      "traefik.docker.network": NAMES.NETWORK,
    };
    const args: ContainerCreateOptions = {
      name: `${name}-${Date.now()}`,
      Image: image,
      HostConfig: {
        Binds: [],
      },
    };

    if (options.commands?.length) {
      args.Cmd = options.commands;
    }
    if (options.entrypoints?.length) {
      args.Entrypoint = options.entrypoints;
    }
    if (options.healthcheck?.cmd) {
      const h = options.healthcheck;
      args.Healthcheck = {
        Test: h.cmd,
        Retries: h.retries ?? 0,
        Interval: (h.interval ?? 0) * 1000 * 1000000,
        StartPeriod: (h.start ?? 0) * 1000 * 1000000,
        Timeout: (h.timeout ?? 0) * 1000 * 1000000,
      };
    }
    if (options.restart && args.HostConfig) {
      args.HostConfig.RestartPolicy = {
        Name: options.restart,
      };
    }
    if (options.init && args.HostConfig) {
      args.HostConfig.Init = true;
    }
    if (options.rm && args.HostConfig) {
      args.HostConfig.AutoRemove = true;
    }
    if (options.privileged && args.HostConfig) {
      args.HostConfig.Privileged = true;
    }
    if (options.user) {
      args.User = options.user;
    }
    if (options.workdir) {
      args.WorkingDir = options.workdir;
    }
    if (options.hosts?.length && args.HostConfig) {
      args.HostConfig.ExtraHosts = Object.entries(options.hosts).map(([name, value]) => `${name}:${value}`);
    }

    // web
    if (options.rule || options.domain?.length) {
      const rule = (options.rule || options.domain?.map((d) => `Host(\`${d}\`)`).join(" || ")) as string;
      const port = options.port ?? 3000;
      const scheme = options.scheme ?? "http";
      const middlewares: string[] = [];

      // service
      labels[`traefik.http.routers.${name}.service`] = name;
      labels[`traefik.http.services.${name}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port);

      // route
      if (options.tls) {
        // https
        labels[`traefik.http.routers.${name}.rule`] = rule;
        labels[`traefik.http.routers.${name}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}.tls.certresolver`] = NAMES.CERTIFICATE;
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
      for (const middleware of options.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options)) {
          labels[`traefik.http.middlewares.${name}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    for (const port of options.ports ?? []) {
      const proto = port.proto;
      const hport = port.hport;
      const cport = port.cport;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.entrypoints`] = `${proto}${cport}`;
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.service`] = `${name}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${proto}-${cport}.loadbalancer.server.port`] = String(hport);
    }

    // volumes
    for (const volume of options.volumes ?? []) {
      const binds = args.HostConfig?.Binds as string[];
      const hpath = path.join(PATHS.VOLUMES, volume.hpath.replace(/^@\//, ""));
      const cpath = volume.cpath;
      const ro = volume.readonly ? "ro" : "rw";
      binds.push(`${hpath}:${cpath}:${ro}`);
    }

    // envs & labels
    args.Env = Object.entries(envs).map(([name, value]) => `${name}=${value}`);
    args.Labels = labels;

    // create container
    const container = await this.docker.createContainer(args);

    // networks
    const dn = await this.docker.depkerNetwork();
    await dn.connect({ Container: container.id });
    for (const [network, alias] of Object.entries(options.networks ?? {})) {
      const dn = await this.docker.initNetwork(network);
      await dn.connect({
        Container: container.id,
        EndpointConfig: {
          Aliases: [alias],
        },
      });
    }

    try {
      // start
      await container.start();

      // wait healthcheck, max timeout 1h
      await logger.log(`Waiting container ${name} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const info = await container.inspect();
        const status = info.State.Status.toLowerCase();
        const health = info.State.Health?.Status?.toLowerCase();
        if (status !== "created" && health !== "starting") {
          if (status === "running" && (!health || health === "healthy")) {
            break;
          } else {
            throw new Error(`Start container ${name} is unhealthy.`);
          }
        }
        if (i % 10 === 0) {
          await logger.log(`Waiting... ${i * 3}s`);
        }
      }

      // rename
      try {
        const running = this.docker.getContainer(name);
        await running.rename({ name: `${name}-${Date.now()}` });
      } catch (e) {
        // ignore
      }

      await container.rename({ name });
      await logger.success(`Start container ${name} successful.`);
      return container.id;
    } catch (e: any) {
      await logger.error(`Start container ${name} failure.`, e);
      throw new Error(`Start container ${name} failure. Caused by ${e.message}`);
    }
  }
}
