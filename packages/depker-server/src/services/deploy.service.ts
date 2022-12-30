import { Injectable } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "./storage.service";
import { In, LessThan, Not } from "typeorm";
import pAll from "p-all";
import { PluginService } from "./plugin.service";
import { PackContext } from "../plugins/pack.context";
import { Setting } from "../entities/setting.entity";
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
import { LogFunc } from "../types";
import { Cron } from "../entities/cron.entity";
import { CronTime } from "cron";
import { CronHistory } from "../entities/cron-history.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DeployEvent } from "../events/deploy.event";
import { CronEvent } from "../events/cron.event";

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

export interface DeployBuildArgs {
  name: string;
  project: string;
  options: DeployBuildOptions;
  logger: LogFunc;
}

export interface DeployStartArgs {
  name: string;
  image: string;
  options: DeployStartOptions;
  logger: LogFunc;
}

export interface DeployCronArgs {
  name: string;
  image: string;
  cron: string;
  options: DeployStartOptions;
  logger: LogFunc;
}

@Injectable()
export class DeployService {
  constructor(
    private readonly docker: DockerService,
    private readonly storages: StorageService,
    private readonly plugins: PluginService,
    private readonly events: EventEmitter2,
    private readonly ref: ModuleRef
  ) {}

  public async deployTask() {
    // find deploys
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

    // skip on empty deploy
    if (!deploys.length) {
      return;
    }

    // get settings
    const setting = await Setting.read();

    // create actions
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

        // emit pre_start
        await this.events.emitAsync(DeployEvent.PRE_START, deploy);

        // update status to running
        await Deploy.update(deploy.id, { status: "running" });

        // emit post_start
        await this.events.emitAsync(DeployEvent.POST_START, deploy);

        // find buildpack
        const buildpack = (await this.plugins.buildpacks())[service.buildpack];
        if (!buildpack?.buildpack?.handler) {
          throw new Error(`Not found buildpack ${service.buildpack}`);
        }

        // emit pre_init
        await this.events.emitAsync(DeployEvent.PRE_INIT, deploy);

        // init project
        const project = await this.storages.project(service.name, deploy.target);

        // init context
        const context = new PackContext({
          name: buildpack.name,
          deploy: deploy,
          project: project,
          ref: this.ref,
        });

        // emit post_init
        await this.events.emitAsync(DeployEvent.POST_INIT, deploy);

        // emit pre_pack
        await this.events.emitAsync(DeployEvent.PRE_PACK, context);

        // deployment containers
        await buildpack.buildpack.handler(context);

        // emit post_pack
        await this.events.emitAsync(DeployEvent.POST_PACK, context);

        // purge containers
        await logger.step(`Purge ${service.name} containers started.`);
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

        // emit purged
        await this.events.emitAsync(DeployEvent.PURGED, deploy);

        // update status to success
        await Deploy.update(deploy.id, { status: "success" });

        // emit success
        await this.events.emitAsync(DeployEvent.SUCCESS, deploy);

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

        // emit failed
        await this.events.emitAsync(DeployEvent.FAILED, deploy);

        // save failed logs
        await logger.error(`Deployment service ${service.name} failure. Caused by ${e}.`);
      }
    });

    await pAll(actions, { concurrency: setting.concurrency });
  }

  public async scheduleTask() {
    // query all cron task
    const all = await Cron.find({
      where: {},
      order: {
        createdAt: "asc",
      },
      relations: {
        service: true,
      },
    });

    // filter active cron task
    const histories = all
      .filter((cron) => Math.abs(new CronTime(cron.time).getTimeout()) < 60000)
      .map((cron) => {
        const history = new CronHistory();
        history.service = cron.service;
        history.options = cron.options;
        history.status = "queued";
        return history;
      });

    // skip on empty cron task
    if (!histories.length) {
      return;
    }

    // schedule history
    await CronHistory.save(histories);
  }

  public async jobTask() {
    const histories = await CronHistory.find({
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

    // skip on empty histories
    if (!histories.length) {
      return;
    }

    // get settings
    const setting = await Setting.read();

    const actions = histories.map((history) => async () => {
      // values
      const service = history.service;
      const logger = history.logger;
      const name = service.name;
      const image = history.options.image;
      const options = history.options.options;

      try {
        // if status equal running, explain that deploy is interrupted during execution, restart
        if (history.status === "running") {
          await logger.step(`Building halted, restarting...`);
        }

        // stop old job
        if (setting.concurrency === 1) {
          await CronHistory.update(
            {
              service: {
                name: Not(service.name),
              },
              id: Not(history.id),
              status: In(["queued", "running"]),
              createdAt: LessThan(new Date(Date.now() - 10 * 1000)),
            },
            {
              status: "failed",
            }
          );
        }

        // log started
        await logger.step(`Trigger service ${service.name} started.`);

        // emit pre_start
        await this.events.emitAsync(CronEvent.PRE_START, history);

        // update status to running
        await CronHistory.update(history.id, { status: "running" });

        // emit post_start
        await this.events.emitAsync(CronEvent.POST_START, history);

        // emit pre_run
        await this.events.emitAsync(CronEvent.PRE_RUN, history);

        // running service
        await this._run({ name, image, options, logger });

        // emit post_run
        await this.events.emitAsync(CronEvent.POST_RUN, history);

        // update status to success
        await CronHistory.update(history.id, { status: "success" });

        // emit success
        await this.events.emitAsync(CronEvent.SUCCESS, history);

        // log successful
        await logger.success(`Trigger service ${service.name} successful.`);
      } catch (e: any) {
        // update status to failed
        await CronHistory.update(history.id, { status: "failed" });

        // emit failed
        await this.events.emitAsync(CronEvent.FAILED, history);

        // save failed logs
        await logger.error(`Trigger service ${service.name} failure. Caused by ${e}.`);
      }
    });

    await pAll(actions, { concurrency: setting.concurrency });
  }

  public async _build(args: DeployBuildArgs) {
    const { name, project, options, logger } = args;

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

  public async _create(args: DeployStartArgs) {
    const { name, image, options } = args;

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
    const create: ContainerCreateOptions = {
      name: `${name}-${Date.now()}`,
      Image: image,
      HostConfig: {
        Binds: [],
      },
    };

    if (options.commands?.length) {
      create.Cmd = options.commands;
    }
    if (options.entrypoints?.length) {
      create.Entrypoint = options.entrypoints;
    }
    if (options.healthcheck?.cmd) {
      const h = options.healthcheck;
      create.Healthcheck = {
        Test: h.cmd,
        Retries: h.retries ?? 0,
        Interval: (h.interval ?? 0) * 1000 * 1000000,
        StartPeriod: (h.start ?? 0) * 1000 * 1000000,
        Timeout: (h.timeout ?? 0) * 1000 * 1000000,
      };
    }
    if (options.restart && create.HostConfig) {
      create.HostConfig.RestartPolicy = {
        Name: options.restart,
      };
    }
    if (options.init && create.HostConfig) {
      create.HostConfig.Init = true;
    }
    if (options.rm && create.HostConfig) {
      create.HostConfig.AutoRemove = true;
    }
    if (options.privileged && create.HostConfig) {
      create.HostConfig.Privileged = true;
    }
    if (options.user) {
      create.User = options.user;
    }
    if (options.workdir) {
      create.WorkingDir = options.workdir;
    }
    if (options.hosts?.length && create.HostConfig) {
      create.HostConfig.ExtraHosts = Object.entries(options.hosts).map(([name, value]) => `${name}:${value}`);
    }

    // web
    if (options.rule || options.domain?.length) {
      const rule = (options.rule || options.domain?.map((d) => `Host(\`${d}\`)`).join(" || ")) as string;
      const port = options.port ?? 80;
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
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.entrypoints`] = `${proto}${hport}`;
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.service`] = `${name}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${proto}-${cport}.loadbalancer.server.port`] = String(cport);
    }

    // volumes
    for (const volume of options.volumes ?? []) {
      const binds = create.HostConfig?.Binds as string[];
      const hpath = path.join(PATHS.VOLUMES, volume.hpath.replace(/^@\//, ""));
      const cpath = volume.cpath;
      const ro = volume.readonly ? "ro" : "rw";
      binds.push(`${hpath}:${cpath}:${ro}`);
    }

    // envs & labels
    create.Env = Object.entries(envs).map(([name, value]) => `${name}=${value}`);
    create.Labels = labels;

    // create container
    const container = await this.docker.createContainer(create);

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

    return container;
  }

  public async _start(args: DeployStartArgs) {
    const { name, logger } = args;

    // logger
    await logger.step(`Start container ${name} started.`);

    // create
    const container = await this._create(args);

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
      return `container:${container.id}`;
    } catch (e: any) {
      await logger.error(`Start container ${name} failure.`, e);
      throw new Error(`Start container ${name} failure. Caused by ${e.message}`);
    }
  }

  public async _run(args: DeployStartArgs) {
    const { name, logger } = args;

    // logger
    await logger.step(`Run container ${name} started.`);

    // create
    const container = await this._create(args);

    try {
      // attach
      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      stream.setEncoding("utf-8");
      const readline = createInterface({ input: stream });
      readline.on("line", (line) => {
        logger.log(line);
      });

      // start
      await container.start();
      await logger.success(`Run container ${name} successful.`);

      // wait
      await container.wait();
      await logger.success(`Run container ${name} stopped.`);
    } catch (e: any) {
      await logger.error(`Run container ${name} failure.`, e);
      throw new Error(`Run container ${name} failure. Caused by ${e.message}`);
    }
  }

  public async _cron(args: DeployCronArgs) {
    const { name, image, cron, options, logger } = args;

    // logger
    await logger.step(`Enqueue schedule task ${name} started.`);

    // update values
    options.rm = true;
    options.restart = "no";

    try {
      // enqueue
      await Cron.save({
        service: { name },
        time: cron,
        options: { image, options } as any,
      });
      await logger.success(`Enqueue schedule task ${name} successful.`);
      return `cron:${name}`;
    } catch (e: any) {
      await logger.error(`Enqueue schedule task ${name} failure.`, e);
      throw new Error(`Enqueue schedule task ${name} failure. Caused by ${e.message}`);
    }
  }
}
