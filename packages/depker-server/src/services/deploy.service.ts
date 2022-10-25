import { Injectable } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "./storage.service";
import { PassThrough } from "stream";
import { createInterface } from "readline";
import { IMAGES, NAMES, PATHS } from "../constants/depker.constant";
import { ContainerCreateOptions, ContainerInfo } from "dockerode";
import path from "path";
import { In, LessThan, Not } from "typeorm";
import pAll from "p-all";
import { PluginService } from "./plugin.service";
import { PackContext } from "../plugins/plugin.context";
import { HttpService } from "nestjs-http-promise";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App } from "../entities/app.entity";
import { Log } from "../entities/log.entity";
import { Volume } from "../entities/volume.entity";
import { Port } from "../entities/port.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PortBind } from "../entities/port-bind.entity";

@Injectable()
export class DeployService {
  constructor(
    private readonly docker: DockerService,
    private readonly storages: StorageService,
    private readonly plugins: PluginService,
    private readonly http: HttpService,
    private readonly events: EventEmitter2,
    private readonly schedule: SchedulerRegistry
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
        app: {
          volumes: {
            bind: true,
          },
          ports: {
            bind: true,
          },
        },
      },
    });

    if (!deploys.length) {
      return;
    }

    const actions = deploys.map((deploy) => async () => {
      try {
        // if status equal running, explain that deploy is interrupted during execution, restart
        if (deploy.status === "running") {
          await Log.step(deploy, `Building halted, restarting...`);
        }

        // stop old deploys
        if (setting.concurrency === 1) {
          await Deploy.update(
            {
              app: {
                name: Not(deploy.app.name),
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
        await Log.step(deploy, `Deployment app ${deploy.app.name} started.`);

        // update status to running
        await Deploy.update(deploy.id, { status: "running" });

        // init project
        const project = await this.project(deploy);
        if (!project) {
          throw new Error(`init project`);
        }

        // build image
        const image = await this.build(deploy, project);
        if (!image) {
          throw new Error(`build image`);
        }

        // start container
        const container = await this.start(deploy, image);
        if (!container) {
          throw new Error(`start container`);
        }

        // purge containers
        await this.purge(deploy);

        // update status to success
        await Deploy.update(deploy.id, { status: "success" });

        // log successful
        await Log.success(deploy, `Deployment app ${deploy.app.name} successful.`);
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
        await Log.failed(deploy, `Deployment app ${deploy.app.name} failure. Caused by ${e}.`);
      }
    });

    await pAll(actions, { concurrency: setting.concurrency });
  }

  public async project(deploy: Deploy) {
    const pack = await this.plugins.plugin(deploy.app.buildpack);

    if (!pack || !pack.buildpack) {
      await Log.failed(
        deploy,
        `Init project ${deploy.app.name} failure. Caused by not found buildpack ${deploy.app.buildpack}`
      );
      return null;
    }

    const dir = await this.storages.project(deploy.app.name, deploy.commit);
    await pack.buildpack(
      new PackContext({
        name: pack.name,
        deploy: deploy,
        project: dir,
        http: this.http,
        events: this.events,
        docker: this.docker,
        schedule: this.schedule,
        entities: {
          Setting: Setting,
          Token: Token,
          App: App,
          Log: Log,
          Volume: Volume,
          Port: Port,
          VolumeBind: VolumeBind,
          PortBind: PortBind,
        },
      })
    );
    return dir;
  }

  public async build(deploy: Deploy, dir: string) {
    const app = deploy.app;
    const tag = `depker-${app.name}:${deploy.id}`;

    // logger
    await Log.step(deploy, `Building image ${tag} started.`);

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

    // secrets
    // prettier-ignore
    const secrets = app.secrets.filter(s => s.onbuild).map(s => `${s.name}=${s.value}`).join("\n");
    const sec = await this.storages.file(deploy.app.name, "secret", `${secrets}\n`);

    // output
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => {
      Log.log(deploy, line);
    });

    // build image
    await this.docker.pullImage(IMAGES.DOCKER);
    const [result] = await this.docker.run(IMAGES.DOCKER, [`sh`, `-c`, commands.join(" ")], through, {
      WorkingDir: "/app",
      HostConfig: {
        AutoRemove: true,
        Binds: [`${PATHS.LINUX(sec)}:/sec`, `${PATHS.LINUX(dir)}:/app`, `/var/run/docker.sock:/var/run/docker.sock`],
      },
    });
    if (result.StatusCode === 0) {
      await Log.success(deploy, `Building image ${tag} successful.`);
      return tag;
    } else {
      await Log.failed(deploy, `Building image ${tag} failure.`);
      return null;
    }
  }

  public async start(deploy: Deploy, image: string) {
    const app = deploy.app;

    // logger
    await Log.step(deploy, `Start container ${app.name} started.`);

    // parameters
    const id = String(deploy.id);
    const name = app.name;
    const commit = deploy.commit;

    // create options
    const options: ContainerCreateOptions = {
      name: `${name}-${id}-${Date.now()}`,
      Image: image,
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
        "traefik.docker.network": NAMES.NETWORK,
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
      const h = app.healthcheck;
      options.Healthcheck = {
        Test: h.cmd,
        Retries: h.retries ?? 0,
        Interval: (h.interval ?? 0) * 1000 * 1000000,
        StartPeriod: (h.start ?? 0) * 1000 * 1000000,
        Timeout: (h.timeout ?? 0) * 1000 * 1000000,
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
      for (const middleware of app.middlewares) {
        for (const [k, v] of Object.entries(middleware.options)) {
          labels[`traefik.http.middlewares.${name}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    for (const port of app.ports) {
      const proto = port.bind.proto;
      const hport = port.bind.port;
      const cport = port.port;
      const labels = options.Labels as Record<string, string>;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.entrypoints`] = `${proto}${cport}`;
      labels[`traefik.${proto}.routers.${name}-${proto}-${cport}.service`] = `${name}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${proto}-${cport}.loadbalancer.server.port`] = String(hport);
    }

    // volumes
    for (const volume of app.volumes) {
      const binds = options.HostConfig?.Binds as string[];
      const hpath = volume.bind.path;
      const cpath = volume.path;
      const ro = volume.readonly ? "ro" : "rw";
      if (volume.bind.global) {
        binds.push(`${hpath}:${cpath}:${ro}`);
      } else {
        binds.push(`${path.join(PATHS.VOLUMES, volume.bind.name, hpath)}:${cpath}:${ro}`);
      }
    }

    // create container
    const container = await this.docker.createContainer(options);

    // networks
    const dn = await this.docker.depkerNetwork();
    await dn.connect({ Container: container.id });
    for (const [network, alias] of Object.entries(app.networks)) {
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
      await Log.log(deploy, `Waiting container ${app.name} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const info = await container.inspect();
        const status = info.State.Status.toLowerCase();
        const health = info.State.Health?.Status?.toLowerCase();
        if (status !== "created" && health !== "starting") {
          if (status === "running" && (!health || health === "healthy")) {
            break;
          } else {
            throw new Error(`Start container ${app.name} is unhealthy.`);
          }
        }
        if (i % 10 === 0) {
          await Log.log(deploy, `Waiting... ${i * 3}s`);
        }
      }

      await Log.success(deploy, `Start container ${app.name} successful.`);
      return container.id;
    } catch (e: any) {
      await Log.failed(deploy, `Start container ${app.name} failure.`, e);
      return null;
    }
  }

  public async purge(deploy: Deploy) {
    await Log.step(deploy, `Purge ${deploy.app.name} containers started.`);
    let infos: ContainerInfo[];
    infos = await this.docker.listContainers({ all: true });
    infos = infos.filter((c) => c.Labels["depker.name"] === deploy.app.name);
    infos = infos.filter((c) => c.Labels["depker.id"] !== String(deploy.id));
    for (const info of infos) {
      const container = this.docker.getContainer(info.Id);
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        await Log.failed(deploy, `Purge container ${container.id} failed.`, e);
      }
    }
    process.nextTick(async () => {
      const setting = await Setting.read();
      if (setting.purge) {
        await Promise.all([this.docker.pruneImages(), this.docker.pruneVolumes()]);
      }
    });
  }
}
