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
import { CronTime } from "cron";
import { Cron } from "../entities/cron.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DeployEvent } from "../events/deploy.event";
import { CronEvent } from "../events/cron.event";
import { command } from "../utils/command.util";

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
  commands?: string;
  entrypoints?: string;
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

export interface DeployCreateArgs {
  name: string;
  image: string;
  cron: string;
  options: DeployStartOptions;
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

export interface DeployAttachArgs {
  name: string;
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
          plugin: buildpack,
          deploy: deploy,
          project: project,
          ref: this.ref,
        });

        // emit post_init
        await this.events.emitAsync(DeployEvent.POST_INIT, deploy);

        // purge containers
        await logger.step(`Purge ${service.name} residual containers started.`);
        await this.docker.containers.purge(service.name);

        // emit pre_pack
        await this.events.emitAsync(DeployEvent.PRE_PACK, context);

        // deployment containers
        await buildpack.buildpack.handler(context);

        // emit post_pack
        await this.events.emitAsync(DeployEvent.POST_PACK, context);

        // purge containers
        await logger.step(`Purge ${service.name} containers started.`);
        await this.docker.containers.purge(service.name);

        // purge images and volumes
        process.nextTick(async () => {
          await this.docker.prune();
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
    const infos = await this.docker.containers.list();

    // filter active cron task
    const crons = infos
      .filter(
        (i) =>
          i.Labels["depker.name"] &&
          i.Labels["depker.cron"] &&
          Math.abs(new CronTime(i.Labels["depker.cron"]).getTimeout()) < 60000
      )
      .map((i) => {
        const history = new Cron();
        history.serviceName = i.Labels["depker.name"];
        history.status = "queued";
        return history;
      });

    // skip on empty cron task
    if (!crons.length) {
      return;
    }

    // schedule history
    await Cron.save(crons);
  }

  public async jobTask() {
    const crons = await Cron.find({
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

    // skip on empty crons
    if (!crons.length) {
      return;
    }

    // get settings
    const setting = await Setting.read();

    const actions = crons.map((history) => async () => {
      // values
      const service = history.service;
      const logger = history.logger;
      const name = service.name;

      try {
        // if status equal running, explain that deploy is interrupted during execution, restart
        if (history.status === "running") {
          await logger.step(`Building halted, restarting...`);
        }

        // stop old job
        if (setting.concurrency === 1) {
          await Cron.update(
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
        await Cron.update(history.id, { status: "running" });

        // emit post_start
        await this.events.emitAsync(CronEvent.POST_START, history);

        // emit pre_run
        await this.events.emitAsync(CronEvent.PRE_RUN, history);

        // running service
        await this._attach({ name, logger });

        // emit post_run
        await this.events.emitAsync(CronEvent.POST_RUN, history);

        // update status to success
        await Cron.update(history.id, { status: "success" });

        // emit success
        await this.events.emitAsync(CronEvent.SUCCESS, history);

        // log successful
        await logger.success(`Trigger service ${service.name} successful.`);
      } catch (e: any) {
        // update status to failed
        await Cron.update(history.id, { status: "failed" });

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
    const result = await this.docker.containers.run(
      IMAGES.DOCKER,
      [`sh`, `-c`, commands.join(" ")],
      (line) => logger.log(line),
      {
        WorkingDir: "/project",
        HostConfig: {
          AutoRemove: true,
          Binds: [
            `${PATHS.LINUX(project)}:/project`,
            `${PATHS.LINUX(secrets)}:/secrets`,
            `/var/run/docker.sock:/var/run/docker.sock`,
          ],
        },
      }
    );
    if (result.StatusCode === 0) {
      await logger.success(`Building image ${image} successful.`);
      return image;
    } else {
      await logger.error(`Building image ${image} failure.`);
      throw new Error(`Build image ${image} failure.`);
    }
  }

  public async _create(args: DeployCreateArgs) {
    const { name, image, cron, options } = args;
    const time = String(Date.now());

    // args
    const envs: Record<string, string> = {
      ...options.secrets,
      DEPKER_NAME: name,
      DEPKER_TIME: time,
      DEPKER_IMAGE: image,
      DEPKER_CRON: cron,
    };
    const labels: Record<string, string> = {
      ...options.labels,
      "depker.name": name,
      "depker.time": time,
      "depker.image": image,
      "depker.cron": cron,
      "traefik.enable": "true",
      "traefik.docker.network": NAMES.NETWORK,
    };
    const create: ContainerCreateOptions = {
      name: `${name}-${time}`,
      Image: image,
      HostConfig: {
        Binds: [],
      },
    };

    if (options.commands?.length) {
      create.Cmd = command(options.commands);
    }
    if (options.entrypoints?.length) {
      create.Entrypoint = command(options.entrypoints);
    }
    if (options.healthcheck?.cmd) {
      const h = options.healthcheck;
      create.Healthcheck = {
        Test: command(h.cmd),
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
    // prettier-ignore
    if (options.rule || options.domain?.length) {
      const rule = (options.rule || options.domain?.map((d) => `Host(\`${d}\`)`).join(" || ")) as string;
      const port = options.port ?? 80;
      const scheme = options.scheme ?? "http";
      const middlewares: string[] = [];

      // service
      labels[`traefik.http.routers.${name}-${time}.service`] = `${name}-${time}`;
      labels[`traefik.http.services.${name}-${time}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}-${time}.loadbalancer.server.port`] = String(port);

      // route
      if (options.tls) {
        // https
        labels[`traefik.http.routers.${name}-${time}.rule`] = rule;
        labels[`traefik.http.routers.${name}-${time}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}-${time}.tls.certresolver`] = NAMES.CERTIFICATE;
        // http
        labels[`traefik.http.routers.${name}-${time}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${time}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${name}-${time}-http.middlewares`] = `${name}-${time}-https`;
        labels[`traefik.http.middlewares.${name}-${time}-https.redirectscheme.scheme`] = "https";
      } else {
        // http
        labels[`traefik.http.routers.${name}-${time}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${time}-http.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of options.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options)) {
          labels[`traefik.http.middlewares.${name}-${time}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${time}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}-${time}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    // prettier-ignore
    for (const port of options.ports ?? []) {
      const proto = port.proto;
      const hport = port.hport;
      const cport = port.cport;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${name}-${time}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${name}-${time}-${proto}-${cport}.entrypoints`] = `${proto}${hport}`;
      labels[`traefik.${proto}.routers.${name}-${time}-${proto}-${cport}.service`] = `${name}-${time}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${time}-${proto}-${cport}.loadbalancer.server.port`] = String(cport);
    }

    // volumes
    for (const volume of options.volumes ?? []) {
      const binds = create.HostConfig?.Binds as string[];
      const hpath = path.isAbsolute(volume.hpath) ? volume.hpath : path.join(PATHS.VOLUMES, volume.hpath);
      const cpath = volume.cpath;
      const ro = volume.readonly ? "ro" : "rw";
      binds.push(`${PATHS.LINUX(hpath)}:${cpath}:${ro}`);
    }

    // envs & labels
    create.Env = Object.entries(envs).map(([name, value]) => `${name}=${value}`);
    create.Labels = labels;

    // create container
    const container = await this.docker.containers.create(create);

    // networks
    const dn = await this.docker.networks.depker();
    await dn.connect({ Container: container.id });
    for (const [network, alias] of Object.entries(options.networks ?? {})) {
      const dn = await this.docker.networks.create(network);
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

    // running
    const running = this.docker.containers.get(name);

    // create
    const container = await this._create({ ...args, cron: "" });
    const id = container.id.substring(0, 7);

    try {
      // start
      await container.start();

      // wait healthcheck, max timeout 1h
      await logger.log(`Waiting container ${name} (${id}) to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const info = await container.inspect();
        const status = info.State.Status.toLowerCase();
        const health = info.State.Health?.Status?.toLowerCase();
        if (status !== "created" && health !== "starting") {
          if (status === "running" && (!health || health === "healthy")) {
            break;
          } else {
            throw new Error(`Start container ${name} (${id}) is unhealthy.`);
          }
        }
        if (i % 10 === 0) {
          await logger.log(`Waiting... ${i * 3}s`);
        }
      }

      // rename
      try {
        await running.stop();
      } catch (e) {
        // ignore
      }
      try {
        await running.rename({ name: `${name}-${Date.now()}` });
      } catch (e) {
        // ignore
      }

      await container.rename({ name });
      await logger.success(`Start container ${name} successful.`);
      return container.id;
    } catch (e: any) {
      try {
        await running.start();
      } catch (e) {
        // ignore
      }
      try {
        await running.rename({ name });
      } catch (e) {
        // ignore
      }

      // print logs
      await logger.error(`Start container ${name} (${id}) failure.`, e);

      // print failed logs
      try {
        await logger.step(`Print failed container logs started.`);
        const logs = await this.docker.containers.print(container.id);
        for (const [level, , message] of logs) {
          await logger.upload(level, message);
        }
        await logger.step(`Print failed container logs end.`);
      } catch (e) {
        // ignore
      }

      throw new Error(`Start container ${name} (${id}) failure. Caused by ${e.message}`);
    }
  }

  public async _cron(args: DeployCronArgs) {
    const { name, options, logger } = args;

    // logger
    await logger.step(`Enqueue schedule task ${name} started.`);

    // update values
    options.rm = false;
    options.restart = "no";

    // running
    const running = this.docker.containers.get(name);

    // create
    const container = await this._create({ ...args, cron: args.cron });
    const id = container.id.substring(0, 7);

    try {
      // enqueue
      try {
        await running.stop();
      } catch (e) {
        // ignore
      }
      try {
        await running.rename({ name: `${name}-${Date.now()}` });
      } catch (e) {
        // ignore
      }
      await container.rename({ name });
      await logger.success(`Enqueue schedule task ${name} (${id}) successful.`);
      return container.id;
    } catch (e: any) {
      try {
        await running.rename({ name });
      } catch (e) {
        // ignore
      }
      await logger.error(`Enqueue schedule task ${name} (${id}) failure.`, e);
      throw new Error(`Enqueue schedule task ${name} (${id}) failure. Caused by ${e.message}`);
    }
  }

  public async _attach(args: DeployAttachArgs) {
    const { name, logger } = args;

    // logger
    await logger.step(`Attach container ${name} started.`);

    // create
    const container = await this.docker.containers.get(name);
    const inspect = await container.inspect(name);
    const id = inspect.Id.substring(0, 7);

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
      await logger.success(`Attach container ${name} (${id}) successful.`);

      // wait
      await container.wait();
      await logger.success(`Attach container ${name} (${id}) stopped.`);
    } catch (e: any) {
      await logger.error(`Attach container ${name} (${id}) failure.`, e);
      throw new Error(`Attach container ${name} (${id}) failure. Caused by ${e.message}`);
    }
  }
}
