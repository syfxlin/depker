import { Deploy } from "../entities/deploy.entity";
import { PluginContext, PluginOptions } from "./plugin.context";
import { DeployLogger } from "../entities/log.entity";
import fs from "fs-extra";
import path from "path";
import { App, AppHealthCheck, AppMiddleware, AppPort, AppRestart, AppVolume } from "../entities/app.entity";
import { PassThrough } from "stream";
import { createInterface } from "readline";
import { IMAGES, NAMES, PATHS } from "../constants/depker.constant";
import { ContainerCreateOptions } from "dockerode";

export interface PackOptions extends PluginOptions {
  project: string;
  deploy: Deploy;
}

export interface DeployBuildOptions {
  // options
  pull: boolean;
  cache: boolean;
  // values
  args: Record<string, string>;
  hosts: Record<string, string>;
  labels: Record<string, string>;
  secrets: Record<string, string>;
}

export interface DeployStartOptions {
  // values
  labels: Record<string, string>;
  secrets: Record<string, string>;
  ports: Array<AppPort>;
  volumes: Array<AppVolume>;
  hosts: Record<string, string>;
  networks: Record<string, string>;
  // extensions
  commands: string[];
  entrypoints: string[];
  restart: AppRestart;
  healthcheck: AppHealthCheck;
  init: boolean;
  rm: boolean;
  privileged: boolean;
  user: string;
  workdir: string;
  // web
  domain: string[];
  rule: string;
  port: number;
  scheme: string;
  tls: boolean;
  middlewares: AppMiddleware[];
}

export class PackContext extends PluginContext {
  // logger
  public readonly log: DeployLogger;

  // values
  public readonly project: string;
  public readonly deploy: Deploy;

  constructor(options: PackOptions) {
    super(options);
    this.deploy = options.deploy;
    this.project = options.project;
    this.log = this.Log.logger(options.deploy);
  }

  public dockerfile(data: string) {
    fs.outputFileSync(path.join(this.project, "Dockerfile"), data, "utf-8");
  }

  public exists(file: string) {
    return fs.pathExistsSync(path.join(this.project, file));
  }

  public read(file: string) {
    return fs.readFileSync(path.join(this.project, file), { encoding: "utf-8" });
  }

  public write(file: string, data: string) {
    fs.outputFileSync(path.join(this.project, file), data, "utf-8");
  }

  public async extensions(name?: string, value?: any) {
    const values = this.deploy.app.extensions ?? {};
    if (!name) {
      return values;
    } else if (value === undefined) {
      return values[name];
    } else if (value === null) {
      delete values[name];
    } else {
      values[name] = value;
    }
    this.deploy.app.extensions = values;
    await App.save(this.deploy.app);
  }

  public async deployment(build?: string | Partial<DeployBuildOptions>, start?: Partial<DeployStartOptions>) {
    const app = this.deploy.app;
    const deploy = this.deploy;
    const id = deploy.id;
    const name = app.name;
    const project = this.project;

    const _build_opts = (options: Partial<DeployBuildOptions>): DeployBuildOptions => ({
      pull: options.pull ?? app.pull,
      cache: options.pull ?? app.pull,
      args: {
        ...app.buildArgs,
        ...options.args,
      },
      hosts: {
        ...app.hosts.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.hosts,
      },
      labels: {
        ...app.labels.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.labels,
      },
      secrets: {
        ...app.secrets.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.secrets,
      },
    });

    const _start_opts = (options: Partial<DeployStartOptions>): DeployStartOptions => ({
      ports: [...app.ports, ...(options.ports ?? [])],
      volumes: [...app.volumes, ...(options.volumes ?? [])],
      labels: {
        ...app.labels.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.labels,
      },
      secrets: {
        ...app.secrets.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.secrets,
      },
      hosts: {
        ...app.hosts.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.hosts,
      },
      networks: {
        ...app.networks,
        ...options.networks,
      },
      commands: options.commands ?? app.commands,
      entrypoints: options.entrypoints ?? app.entrypoints,
      restart: options.restart ?? app.restart,
      healthcheck: {
        ...app.healthcheck,
        ...options.healthcheck,
      },
      init: options.init ?? app.init,
      rm: options.rm ?? app.rm,
      privileged: options.privileged ?? app.privileged,
      user: options.user ?? app.user,
      workdir: options.workdir ?? app.workdir,
      domain: options.domain ?? app.domain,
      rule: options.rule ?? app.rule,
      port: options.port ?? app.port,
      scheme: options.scheme ?? app.scheme,
      tls: options.tls ?? app.tls,
      middlewares: options.middlewares ?? app.middlewares,
    });

    const _build = async (image: string, options: DeployBuildOptions) => {
      // logger
      await this.log.step(`Building image ${image} started.`);

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
      for (const [name, value] of Object.entries(options.args)) {
        commands.push(`--build-arg=${name}=${value}`);
      }

      // hosts
      for (const [name, value] of Object.entries(options.hosts)) {
        commands.push(`--add-host=${name}=${value}`);
      }

      // labels
      for (const [name, value] of Object.entries(options.labels)) {
        commands.push(`--label=${name}=${value}`);
      }

      // secrets
      const secrets = await this.storages.file(name);
      // prettier-ignore
      fs.outputFileSync(secrets, Object.entries(options.secrets).map(([name, value]) => `${name}=${value}\n`).join(""));

      // project
      commands.push(".");

      // output
      const through = new PassThrough({ encoding: "utf-8" });
      const readline = createInterface({ input: through });
      readline.on("line", (line) => {
        this.log.log(line);
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
        await this.log.success(`Building image ${image} successful.`);
        return image;
      } else {
        await this.log.error(`Building image ${image} failure.`);
        throw new Error(`Build image ${image} failure.`);
      }
    };

    const _start = async (image: string, options: DeployStartOptions) => {
      // logger
      await this.log.step(`Start container ${name} started.`);

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
        await this.log.log(`Waiting container ${name} to finished.`);
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
            await this.log.log(`Waiting... ${i * 3}s`);
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
        await this.log.success(`Start container ${name} successful.`);
        return container.id;
      } catch (e: any) {
        await this.log.error(`Start container ${name} failure.`, e);
        throw new Error(`Start container ${name} failure. Caused by ${e.message}`);
      }
    };

    if (typeof build === "string") {
      await this.dockerfile(`FROM ${build}`);
      const image = await _build(`depker-${name}:${id}`, _build_opts({}));
      return await _start(image, _start_opts(start ?? {}));
    } else {
      const image = await _build(`depker-${name}:${id}`, _build_opts(build ?? {}));
      return await _start(image, _start_opts(start ?? {}));
    }
  }
}
