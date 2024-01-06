import { Depker } from "../../depker.ts";
import { deepMerge, fs, ignore, nunjucks, osType, path, yaml } from "../../deps.ts";
import { BuildAtConfig, DeployAtConfig, Pack, ServiceConfig, StartAtConfig } from "./service.type.ts";
import { BuilderBuildOptions, ContainerCreateOptions } from "../../services/docker/types.ts";
import { ServiceModule } from "./service.module.ts";

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

  // region public operators

  public static async execute(depker: Depker, config: ServiceConfig): Promise<void> {
    const clone = deepMerge<ServiceConfig>({}, config);
    const source = path.resolve(clone.path ?? Deno.cwd());
    const target = Deno.makeTempDirSync({ prefix: `deploy-${clone.name}-` });

    // unpack
    await depker.emit("service:deploy:before-unpack", clone, source, target);
    depker.log.info(`Unpacking service ${clone.name} started.`);
    const ig = ignore() as any;
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
    if (config.volumes) {
      for (const value of config.volumes) {
        value.hpath = depker.uti.replace(value.hpath, (key) => {
          return depker.cfg.path(key);
        });
      }
    }
    if (config.labels || config.secrets || config.build_args) {
      const secrets = await depker.cfg.secret();
      if (config.labels) {
        for (const [name, value] of Object.entries(config.labels)) {
          config.labels[name] = depker.uti.replace(value, (key) => {
            return secrets[key];
          });
        }
      }
      if (config.secrets) {
        for (const [name, value] of Object.entries(config.secrets)) {
          config.secrets[name] = depker.uti.replace(value, (key) => {
            if (secrets[key] !== undefined && secrets[key] !== null) {
              return String(secrets[key]);
            } else {
              return key;
            }
          });
        }
      }
      if (config.build_args) {
        for (const [name, value] of Object.entries(config.build_args)) {
          config.build_args[name] = depker.uti.replace(value, (key) => {
            if (secrets[key] !== undefined && secrets[key] !== null) {
              return String(secrets[key]);
            } else {
              return key;
            }
          });
        }
      }
    }
    await depker.emit("service:deploy:after-unpack", clone, source, target);
    depker.log.done(`Unpacking service ${clone.name} successfully.`);

    // create context
    const context = new PackContext({
      depker: depker,
      source: source,
      target: target,
      config: clone,
      pack: config[sym] as Pack,
    });

    try {
      // log started
      await depker.emit("service:deploy:started", context);
      depker.log.step(`Deployment service ${clone.name} started.`);

      // emit init event
      await depker.emit("service:deploy:before-init", context);
      depker.log.debug(`Deployment service ${clone.name} initing.`);
      await context.pack.init?.(context);
      await depker.emit("service:deploy:after-init", context);

      // deployment containers
      await depker.emit("service:deploy:before-build", context);
      depker.log.debug(`Deployment service ${clone.name} building.`);
      await context.pack.build?.(context);
      await depker.emit("service:deploy:after-build", context);

      // purge images and volumes
      await depker.emit("service:deploy:before-purge", context);
      depker.log.debug(`Deployment service ${clone.name} purging.`);
      await Promise.all([depker.ops.image.prune(), depker.ops.volume.prune(), depker.ops.network.prune()]);
      await depker.emit("service:deploy:after-purge", context);

      // emit destroy event
      await depker.emit("service:deploy:before-destroy", context);
      depker.log.debug(`Deployment service ${clone.name} destroying.`);
      await context.pack.destroy?.(context);
      await depker.emit("service:deploy:after-destroy", context);

      // log successfully
      await depker.emit("service:deploy:successfully", context);
      depker.log.done(`Deployment service ${clone.name} successfully.`);
    } catch (e) {
      // log failed
      await depker.emit("service:deploy:failure", context);
      depker.log.error(`Deployment service ${clone.name} failure.`, e);
      throw new Error(`Deployment service ${clone.name} failure.`, { cause: e });
    }
  }

  // endregion

  // region public functions

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
    template.addGlobal("json", JSON);
    template.addGlobal("yaml", yaml);
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
      Secrets: {},
    };

    // write secrets
    if (config.secrets && options.Secrets) {
      // prettier-ignore
      const values = Object.entries(config.secrets).map(([k, v]) => `${k}=${v}\n`);
      if (values.length) {
        const file1 = await Deno.makeTempFile();
        await Deno.writeTextFile(file1, values.join(""));
        const file2 = await Deno.makeTempFile();
        await Deno.writeTextFile(file2, values.map((i) => `export ${i}`).join(""));
        options.Secrets.secrets = file1;
        options.Secrets.envs = file2;
      }
    }
    if (!options.Secrets?.secrets && options.Secrets) {
      const file = await Deno.makeTempFile();
      await Deno.writeTextFile(file, "\n");
      options.Secrets.secrets = file;
    }
    if (!options.Secrets?.envs && options.Secrets) {
      const file = await Deno.makeTempFile();
      await Deno.writeTextFile(file, "\n");
      options.Secrets.envs = file;
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
    const id = `${Date.now()}`;
    const name = `${config.name}`;
    const full = `${name}-i${id}`;
    const network = await this.depker.ops.network.default();

    // started
    this.depker.log.step(`Start container ${full} started.`);

    // config
    const envs: Record<string, string> = {
      ...config.secrets,
      DEPKER_ID: id,
      DEPKER_NAME: name,
      DEPKER_VERSION: this.depker.version,
    };
    const labels: Record<string, string> = {
      ...config.labels,
      "depker.id": id,
      "depker.name": name,
      "depker.version": this.depker.version,
      "traefik.enable": "true",
      "traefik.docker.network": network,
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
      labels[`traefik.http.routers.${name}.service`] = `${name}`;
      labels[`traefik.http.services.${name}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port);

      // route
      if (config.tls) {
        // https
        labels[`traefik.http.routers.${name}.rule`] = rule;
        labels[`traefik.http.routers.${name}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}.tls.certresolver`] = "depker";
        // http
        labels[`traefik.http.routers.${name}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${name}-http.middlewares`] = `${name}-https`;
        labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = "https";
        middlewares.push(`${name}-https`);
      } else {
        // http
        labels[`traefik.http.routers.${name}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of config.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options ?? {})) {
          labels[`traefik.http.middlewares.${name}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    // prettier-ignore
    for (const port of config.ports ?? []) {
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
    for (const volume of config.volumes ?? []) {
      options.Volumes = options.Volumes ?? [];
      options.Volumes.push(`${volume.hpath}:${volume.cpath}:${volume.readonly ? "ro" : "rw"}`);
    }

    try {
      // creating
      await this.depker.ops.container.create(full, target, options);
      // starting
      await this.depker.ops.container.start([full]);

      // wait healthcheck, max timeout 1h
      this.depker.log.info(`Waiting container ${full} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const infos = await this.depker.ops.container.inspect([full]);
        if (infos) {
          const status = infos[0].State.Status.toLowerCase();
          const health = infos[0].State.Health?.Status?.toLowerCase();
          if (status !== "created" && health !== "starting") {
            if (status === "running" && (!health || health === "healthy")) {
              break;
            } else {
              throw new Error(`Start container ${full} is unhealthy.`);
            }
          }
        }
        if (i % 5 === 0) {
          this.depker.log.raw(`Waiting: ${i * 2}s`);
        }
      }

      this.depker.log.done(`Start container ${full} successfully.`);
      return full;
    } catch (e) {
      // failure
      this.depker.log.error(`Start container ${full} failure.`, e);
      throw new Error(`Start container ${full} failure.`, { cause: e });
    } finally {
      // cleanup
      await this.depker.module<ServiceModule>(ServiceModule.NAME)?.prune("pre");
    }
  }

  // endregion
}
