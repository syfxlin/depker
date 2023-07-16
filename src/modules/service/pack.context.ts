import { Depker } from "../../depker.ts";
import { fs, ignore, nunjucks, osType, path } from "../../deps.ts";
import { BuildAtConfig, DeployAtConfig, Pack, ServiceConfig, StartAtConfig } from "./service.type.ts";
import { BuilderBuildOptions, ContainerCreateOptions } from "../../types/results.type.ts";

interface PackOptions {
  depker: Depker;
  config: ServiceConfig;
  pack: Pack;
  source: string;
  target: string;
}

export const sym = Symbol("pack");

export function pack<C extends ServiceConfig = ServiceConfig>(pack: Pack<C>) {
  return (config: C) => {
    // @ts-ignore
    config[sym] = pack;
    return config;
  };
}

export class PackContext<Config extends ServiceConfig = ServiceConfig> {
  // constants
  public static readonly OS_TYPE = osType;

  // defined
  public readonly depker: Depker;
  public readonly config: Config;

  // generated
  public readonly pack: Pack;
  public readonly source: string;
  public readonly target: string;

  private constructor(options: PackOptions) {
    this.depker = options.depker;
    this.config = options.config as Config;
    this.pack = options.pack;
    this.source = options.source;
    this.target = options.target;
  }

  public static async deployment(depker: Depker, config: ServiceConfig): Promise<void> {
    // values
    // @ts-ignore
    const pack = config[sym] as Pack;
    const source = path.resolve(config.path ?? Deno.cwd());
    const target = Deno.makeTempDirSync({ prefix: `deploy-${config.name}-` });

    // unpack
    depker.log.info(`Unpacking service ${config.name} started.`);
    const ig = ignore();
    const gi = path.join(source, ".gitignore");
    const di = path.join(source, ".depkerignore");
    if (await fs.exists(gi)) {
      ig.add(await Deno.readTextFile(gi));
    }
    if (await fs.exists(di)) {
      ig.add(await Deno.readTextFile(di));
    }
    await depker.uti.copy(source, target, {
      overwrite: true,
      filter: (p) => {
        const r = path.relative(source, p);
        return !r || !ig.ignores(r);
      },
    });
    depker.log.done(`Unpacking service ${config.name} successfully.`);

    // create context
    const env = new PackContext({ depker, config, pack, source, target });

    try {
      // log started
      depker.log.step(`Deployment service ${config.name} started.`);

      // emit init event
      depker.log.debug(`Deployment service ${config.name} initing.`);
      await pack.init?.(env);

      // purge residual containers
      depker.log.step(`Purge ${config.name} residual containers started.`);
      await PackContext._clear(depker);

      // deployment containers
      depker.log.debug(`Deployment service ${config.name} building.`);
      await pack.build?.(env);

      // purge containers
      await PackContext._clear(depker);

      // purge images and volumes
      await Promise.all([depker.ops.image.prune(), depker.ops.volume.prune(), depker.ops.network.prune()]);

      // emit destroy event
      depker.log.debug(`Deployment service ${config.name} destroying.`);
      await pack.destroy?.(env);

      // log successfully
      depker.log.done(`Deployment service ${config.name} successfully.`);
    } catch (e) {
      // log failed
      depker.log.error(`Deployment service ${config.name} failure.`, e);
      throw new Error(`Deployment service ${config.name} failure.`, { cause: e });
    }
  }

  // region functions

  public env(name: string, value?: string) {
    if (value) {
      Deno.env.set(name, value);
      return value;
    } else {
      return Deno.env.get(name);
    }
  }

  public dockerfile(data: string) {
    this.overwrite("Dockerfile", data);
  }

  public exists(file: string) {
    return fs.existsSync(path.join(path.resolve(this.target), file));
  }

  public read(file: string) {
    return Deno.readTextFileSync(path.join(path.resolve(this.target), file));
  }

  public write(file: string, data: string) {
    if (this.exists(file)) {
      return file;
    }
    this.overwrite(file, data);
    return file;
  }

  public overwrite(file: string, data: string) {
    const root = path.join(path.resolve(this.target), file);
    fs.ensureDirSync(path.dirname(root));
    Deno.writeTextFileSync(root, data);
    return file;
  }

  public async render(value: string, context?: Record<string, any>) {
    // template
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const loader = new nunjucks.FileSystemLoader(path.resolve(this.target));
    const template = new nunjucks.Environment(loader, { autoescape: false, noCache: true });
    // functions
    template.addGlobal("env", self.env.bind(self));
    template.addGlobal("deno", Deno);
    template.addGlobal("self", self);
    template.addGlobal("depker", this.depker);
    template.addGlobal("config", this.config);
    template.addGlobal("pack", this.pack);
    template.addGlobal("source", this.source);
    template.addGlobal("target", this.target);
    // filters
    template.addFilter("command", function (this: any, value: string | string[]) {
      return typeof value === "string" ? value : JSON.stringify(value);
    });
    template.addFilter("render", function (this: any, value: string) {
      return value ? this.env.renderString(value, this.ctx) : "";
    });
    template.addFilter("exists", function (this: any, file: string) {
      return self.exists(file);
    });
    template.addFilter("read", function (this: any, file: string) {
      return self.read(file);
    });
    template.addFilter("write", function (this: any, value: string, file: string) {
      return self.write(file, value);
    });
    template.addFilter("overwrite", function (this: any, value: string, file: string) {
      return self.overwrite(file, value);
    });
    template.addFilter("render_write", function (this: any, value: string, file: string) {
      if (self.exists(file)) {
        const content = this.env.renderString(self.read(file), this.ctx);
        return self.overwrite(file, content);
      } else {
        const content = value ? this.env.renderString(value, this.ctx) : "";
        return self.overwrite(file, content);
      }
    });
    template.addFilter("render_overwrite", function (this: any, value: string, file: string) {
      const content = value ? this.env.renderString(value, this.ctx) : "";
      return self.overwrite(file, content);
    });
    return template.renderString(value, context ?? {});
  }

  // endregion

  // region deploy

  public async deploy() {
    return await this.deployAt(this.target, this.config);
  }

  public async deployAt(target: string, config: DeployAtConfig) {
    return await this.startAt(await this.buildAt(target, config), config);
  }

  public async buildAt(target: string, config: BuildAtConfig): Promise<string> {
    const image = `depker/${config.name}:${Date.now()}`;

    // create options
    const options: BuilderBuildOptions = {
      File: config.file,
      Pull: config.pull,
      Cache: config.cache,
      Args: config.build_args,
      Hosts: config.hosts,
      Labels: config.labels,
    };

    // write secrets
    if (config.secrets) {
      // prettier-ignore
      const value = Object.entries(config.secrets).map(([k, v]) => `export ${k}=${v}\n`).join(``);
      if (value) {
        const file = await Deno.makeTempFile();
        await Deno.writeTextFile(file, value);
        options.Secrets = { secrets: file };
      }
    }

    try {
      // log started
      this.depker.log.step(`Building image ${image} started.`);

      // build image
      await this.depker.ops.builder
        .build(image, target, options)
        .stdin("inherit")
        .stdout("inherit")
        .stderr("inherit")
        .spawn();

      // log successfully
      this.depker.log.done(`Building image ${image} successfully.`);
    } catch (e) {
      // log failed
      this.depker.log.error(`Building image ${image} failed.`);
      throw new Error(`Building image ${image} failed.`);
    }

    // prettier-ignore
    try {
      // log started
      this.depker.log.step(`Transferring image ${image} started.`);

      // transfer image
      const size = { value: 0 };
      const interval = setInterval(() => this.depker.log.raw(`Transferring: ${this.depker.uti.bytes(size.value)}`), 2000);
      await this.depker.ops.transfer(image, (v) => (size.value = v ?? size.value));
      clearInterval(interval);

      // log successfully
      this.depker.log.done(`Transferring image ${image} successfully.`);
    } catch (e) {
      // log failed
      this.depker.log.error(`Transferring image ${image} failed.`);
      throw new Error(`Transferring image ${image} failed.`);
    }

    return image;
  }

  public async startAt(target: string, config: StartAtConfig): Promise<string> {
    // values
    const id = String(Date.now());
    const name = config.name;

    // log started
    this.depker.log.step(`Start container ${name} started.`);

    // running
    const running = await this._find(name);

    // creating
    const deploying = await this._create(id, target, config);

    try {
      // starting
      await this.depker.ops.container.start([deploying]);

      // wait healthcheck, max timeout 1h
      this.depker.log.info(`Waiting container ${name} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const infos = await this.depker.ops.container.inspect([deploying]);
        if (infos) {
          const status = infos[0].State.Status.toLowerCase();
          const health = infos[0].State.Health?.Status?.toLowerCase();
          if (status !== "created" && health !== "starting") {
            if (status === "running" && (!health || health === "healthy")) {
              break;
            } else {
              throw new Error(`Start container ${name} is unhealthy.`);
            }
          }
        }
        if (i % 5 === 0) {
          this.depker.log.raw(`Waiting: ${i * 2}s`);
        }
      }

      // rename
      try {
        if (running) {
          await this.depker.ops.container.stop([running]);
        }
      } catch (e) {
        // ignore
      }
      try {
        if (running) {
          await this.depker.ops.container.rename(running, `${name}-${Date.now()}`);
        }
      } catch (e) {
        // ignore
      }

      await this.depker.ops.container.rename(deploying, name);
      this.depker.log.done(`Start container ${name} successfully.`);
      return deploying;
    } catch (e) {
      // rename
      try {
        if (running) {
          await this.depker.ops.container.start([running]);
        }
      } catch (e) {
        // ignore
      }
      try {
        if (running) {
          await this.depker.ops.container.rename(running, name);
        }
      } catch (e) {
        // ignore
      }

      // print logs
      this.depker.log.error(`Start container ${name} failure.`, e);
      throw new Error(`Start container ${name} failure.`, { cause: e });
    }
  }

  private async _find(name: string) {
    const info = await this.depker.ops.container.find(name);
    return info?.Id;
  }

  private async _create(id: string, target: string, config: StartAtConfig) {
    const name = config.name;
    const rename = `${name}-${id}`;
    const network = await this.depker.ops.network.default();

    // values
    const envs: Record<string, string> = {
      ...config.secrets,
      DEPKER_NAME: name,
    };
    const labels: Record<string, string> = {
      ...config.labels,
      "depker.name": name,
    };
    const options: ContainerCreateOptions = {
      // service
      Pull: config.pull ? "always" : "missing",
      Restart: config.restart,
      Commands: config.commands,
      EntryPoints: config.entrypoints,
      Init: config.init,
      Remove: config.remove,
      Envs: envs,
      Labels: labels,
      // healthcheck
      Healthcheck: !config.healthcheck
        ? undefined
        : {
            Test: config.healthcheck.commands,
            Period: config.healthcheck.period,
            Interval: config.healthcheck.interval,
            Retries: config.healthcheck.retries,
            Timeout: config.healthcheck.timeout,
          },
      // network
      Mac: config.mac,
      Dns: config.dns,
      IPv4: config.ipv4,
      IPv6: config.ipv6,
      Host: config.host,
      Hosts: config.hosts,
      Network: network,
      Networks: config.networks,
      // resources
      Cpu: config.cpu,
      Memory: config.memory,
      OOMKill: config.oom_kill,
      // privilege
      Privileged: config.privileged,
      CapAdds: config.cap_adds,
      CapDrops: config.cap_drops,
      // runtime
      User: config.user,
      Workdir: config.workdir,
      Groups: config.groups,
    };

    // web
    // prettier-ignore
    if (config.rule || config.domain?.length) {
      const rule = (config.rule || [config.domain]?.flat()?.map((d) => `Host(\`${d}\`)`).join(" || "));
      const port = config.port ?? 80;
      const scheme = config.scheme ?? "http";
      const middlewares: string[] = [];

      // service
      labels[`traefik.http.routers.${name}-${id}.service`] = `${name}-${id}`;
      labels[`traefik.http.services.${name}-${id}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}-${id}.loadbalancer.server.port`] = String(port);

      // route
      if (config.tls) {
        // https
        labels[`traefik.http.routers.${name}-${id}.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}-${id}.tls.certresolver`] = "depker";
        // http
        labels[`traefik.http.routers.${name}-${id}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${name}-${id}-http.middlewares`] = `${name}-${id}-https`;
        labels[`traefik.http.middlewares.${name}-${id}-https.redirectscheme.scheme`] = "https";
        middlewares.push(`${name}-${id}-https`);
      } else {
        // http
        labels[`traefik.http.routers.${name}-${id}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}-http.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of config.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options ?? {})) {
          labels[`traefik.http.middlewares.${name}-${id}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${id}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}-${id}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    // prettier-ignore
    for (const port of config.ports ?? []) {
      const proto = port.proto;
      const hport = port.hport;
      const cport = port.cport;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.entrypoints`] = `${proto}${hport}`;
      labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.service`] = `${name}-${id}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${id}-${proto}-${cport}.loadbalancer.server.port`] = String(cport);
    }

    // volumes
    for (const volume of config.volumes ?? []) {
      options.Volumes = options.Volumes ?? [];
      options.Volumes.push(`${volume.hpath}:${volume.cpath}:${volume.readonly ? "ro" : "rw"}`);
    }

    try {
      // log start
      this.depker.log.done(`Create container ${name} started.`);

      // create container
      await this.depker.ops.container.create(rename, target, options);

      // log successfully
      this.depker.log.done(`Create container ${name} successfully.`);
      return rename;
    } catch (e: any) {
      // log failed
      this.depker.log.error(`Create container ${name} failure.`, e);
      throw new Error(`Create container ${name} failure.`, { cause: e });
    }
  }

  private static async _clear(depker: Depker) {
    const infos = await depker.ops.container.list();
    const insps = await depker.ops.container.inspect(infos.map((i) => i.Id));
    const needs = new Set<string>();
    for (const insp of insps) {
      const oname = insp.Name;
      const dname = insp.Config.Labels["depker.name"];
      if (dname && dname !== oname) {
        needs.add(insp.Id);
      }
    }
    if (needs.size) {
      await depker.ops.container.remove([...needs], {
        Force: true,
      });
    }
  }

  // endregion
}
