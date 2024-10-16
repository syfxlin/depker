import fs, { getFileInfoType, isSubdir, toPathString } from "../../deps/std/fs.ts";
import path from "../../deps/std/path.ts";
import YAML from "../../deps/std/yaml.ts";
import dotenv from "../../deps/std/dotenv.ts";
import ignore from "../../deps/npm/ignore.ts";
import nunjucks from "../../deps/npm/nunjucks.ts";
import collections from "../../deps/std/collections.ts";
import { BuilderBuildOptions, ContainerCreateOptions } from "../../providers/types.ts";
import { Depker, DepkerHook } from "../../depker.ts";
import { AppConfig, AppPlugin } from "./index.ts";

interface PackOptions<Config extends AppConfig = AppConfig> {
  depker: Depker;
  config: Config;
  source: string;
  target: string;
}

interface CopyOptions {
  filter?: (path: string) => boolean;
  folder?: boolean;
}

export interface Pack<C extends AppConfig = AppConfig> {
  init?: (ctx: PackContext<C>) => Promise<void> | void;
  build?: (ctx: PackContext<C>) => Promise<void> | void;
  destroy?: (ctx: PackContext<C>) => Promise<void> | void;
}

export function pack<C extends AppConfig = AppConfig>(pack: Pack<C>) {
  return (config: C): DepkerHook => (depker) => {
    depker.get<AppPlugin>(AppPlugin.NAME).register({ ...config, $$pack: pack });
  };
}

export class PackContext<Config extends AppConfig = AppConfig> {
  // defined
  public readonly depker: Depker;
  public readonly config: Config;

  // generated
  public readonly id: string;
  public readonly pack: Pack;
  public readonly source: string;
  public readonly target: string;

  public static create(depker: Depker, input: AppConfig) {
    const config = collections.deepMerge<AppConfig>({}, input);
    const source = path.resolve(config.path || Deno.cwd());
    const target = Deno.makeTempDirSync({ prefix: `deploy-${config.name}-` });
    return new PackContext({ depker, config, source, target });
  }

  private constructor(options: PackOptions<Config>) {
    this.id = Date.now().toString(36);
    this.pack = options.config.$$pack;
    this.depker = options.depker;
    this.config = options.config;
    this.source = options.source;
    this.target = options.target;
  }

  public async execute() {
    try {
      // unpack
      this.depker.log.info(`Unpacking app ${this.config.name} started.`);
      await this._copy(this.source, this.target);
      this.depker.log.done(`Unpacking app ${this.config.name} successfully.`);

      // log started
      await this.depker.emit("app:deploy:started", this);
      this.depker.log.step(`Deployment app ${this.config.name} started.`);

      // emit init event
      await this.depker.emit("app:deploy:before-init", this);
      this.depker.log.debug(`Deployment app ${this.config.name} initing.`);
      await this.pack.init?.(this);
      await this.depker.emit("app:deploy:after-init", this);

      // deployment containers
      await this.depker.emit("app:deploy:before-build", this);
      this.depker.log.debug(`Deployment app ${this.config.name} building.`);
      await this.pack.build?.(this);
      await this.depker.emit("app:deploy:after-build", this);

      // purge images and volumes
      await this.depker.emit("app:deploy:before-purge", this);
      this.depker.log.debug(`Deployment app ${this.config.name} purging.`);
      await Promise.all([
        this.depker.node.image.prune(),
        this.depker.node.volume.prune(),
        this.depker.node.network.prune(),
      ]);
      await this.depker.emit("app:deploy:after-purge", this);

      // emit destroy event
      await this.depker.emit("app:deploy:before-destroy", this);
      this.depker.log.debug(`Deployment app ${this.config.name} destroying.`);
      await this.pack.destroy?.(this);
      await this.depker.emit("app:deploy:after-destroy", this);

      // log successfully
      await this.depker.emit("app:deploy:successfully", this);
      this.depker.log.done(`Deployment app ${this.config.name} successfully.`);
    } catch (e) {
      // log failed
      await this.depker.emit("app:deploy:failure", this);
      this.depker.log.error(`Deployment app ${this.config.name} failure.`, e);
      throw new Error(`Deployment app ${this.config.name} failure.`, { cause: e });
    }
  }

  public dockerfile(data: string) {
    this.overwrite("Dockerfile", data.trim());
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
    // eslint-disable-next-line ts/no-this-alias
    const self = this;
    const loader = new nunjucks.FileSystemLoader(path.resolve(this.target));
    const template = new nunjucks.Environment(loader, { autoescape: false, noCache: true });
    // functions
    template.addGlobal("json", JSON);
    template.addGlobal("yaml", YAML);
    template.addGlobal("deno", Deno);
    template.addGlobal("self", self);
    template.addGlobal("depker", this.depker);
    template.addGlobal("config", this.config);
    template.addGlobal("pack", this.pack);
    template.addGlobal("source", this.source);
    template.addGlobal("target", this.target);
    // filters
    template.addFilter("command", (value: string | string[]) => {
      return typeof value === "string" ? value : JSON.stringify(value);
    });
    template.addFilter("exists", (file: string) => {
      return self.exists(file);
    });
    template.addFilter("read", (file: string) => {
      return self.read(file);
    });
    template.addFilter("write", (value: string, file: string) => {
      return self.write(file, value);
    });
    template.addFilter("overwrite", (value: string, file: string) => {
      return self.overwrite(file, value);
    });
    template.addFilter("render", function (this: any, value: string) {
      return value ? this.env.renderString(value, this.ctx) : "";
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

  public async build(apply?: (config: Config) => Promise<Config> | Config): Promise<void> {
    // config
    const config: Config = apply ? await apply(this.config) : this.config;

    // values
    const image = `depker/${config.name}:${this.id}`;

    // create options
    const options: BuilderBuildOptions = {
      File: config.file,
      Pull: config.pull,
      Cache: config.cache,
      Hosts: config.hosts,
      Flags: config.build_options,
    };

    if (config.build_args || config.secrets || config.labels) {
      const dotenvs = await dotenv.load();
      const secrets = await this.depker.config.secret(config.name);
      if (config.build_args) {
        for (const [key, val] of Object.entries(config.build_args)) {
          options.Args = options.Args ?? {};
          options.Args[key] = this._placeholder(val, name => dotenvs[name] || secrets[name]);
        }
      }
      if (config.secrets) {
        for (const [key, val] of Object.entries(config.secrets)) {
          options.Envs = options.Envs ?? {};
          options.Envs[key] = this._placeholder(val, name => dotenvs[name] || secrets[name]);
        }
      }
      if (config.labels) {
        for (const [key, val] of Object.entries(config.labels)) {
          options.Labels = options.Labels ?? {};
          options.Labels[key] = this._placeholder(val, name => dotenvs[name] || secrets[name]);
        }
      }
    }

    try {
      // log started
      this.depker.log.step(`Building image ${image} started.`);

      // build image
      await this.depker.node.builder
        .build(image, this.target, options)
        .stdin("inherit")
        .stdout("inherit")
        .stderr("inherit")
        .spawn();

      // log successfully
      this.depker.log.done(`Building image ${image} successfully.`);
    } catch (e) {
      // log failed
      this.depker.log.error(`Building image ${image} failed.`, e);
      throw new Error(`Building image ${image} failed.`);
    }

    try {
      // log started
      this.depker.log.step(`Transferring image ${image} started.`);

      // transfer image
      const size = { value: 0 };
      const interval = setInterval(() => this.depker.log.raw(`Transferring: ${this.depker.log.byte(size.value)}`), 2000);
      await this.depker.node.transfer(image, v => (size.value = v ?? size.value));
      clearInterval(interval);

      // log successfully
      this.depker.log.done(`Transferring image ${image} successfully.`);
    } catch (e) {
      // log failed
      this.depker.log.error(`Transferring image ${image} failed.`, e);
      throw new Error(`Transferring image ${image} failed.`);
    }
  }

  public async start(apply?: (config: Config) => Promise<Config> | Config): Promise<void> {
    // config
    const config: Config = apply ? await apply(this.config) : this.config;

    // values
    const name = `${config.name}.${this.id}`;
    const image = config.$$image ? config.$$image : `depker/${config.name}:${this.id}`;
    const network = await this.depker.node.network.default();

    // started
    this.depker.log.step(`Start container ${name} started.`);

    // config
    const envs: Record<string, string> = {
      DEPKER_ID: this.id,
      DEPKER_NAME: config.name,
      DEPKER_VERSION: this.depker.version,
    };
    const labels: Record<string, string> = {
      "depker.id": this.id,
      "depker.name": config.name,
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
      Healthcheck: !config.healthcheck ?
        undefined :
          {
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
      NetworkAlias: config.name,
      Networks: config.networks,
      NetworkAliases: config.network_aliases,
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
      // options
      Flags: config.start_options,
    };

    // host
    if (config.rule || config.domain?.length) {
      const rule = (config.rule || [config.domain]?.flat()?.map(d => `Host(\`${d}\`)`).join(" || "));
      const port = config.port || 80;
      const scheme = config.scheme || "http";
      const middlewares: string[] = [];

      // service
      labels[`traefik.http.routers.${config.name}-${this.id}.service`] = `${config.name}-${this.id}`;
      labels[`traefik.http.services.${config.name}-${this.id}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${config.name}-${this.id}.loadbalancer.server.port`] = String(port);

      // route
      if (config.tls) {
        // https
        labels[`traefik.http.routers.${config.name}-${this.id}.rule`] = rule;
        labels[`traefik.http.routers.${config.name}-${this.id}.entrypoints`] = "https";
        labels[`traefik.http.routers.${config.name}-${this.id}.tls.certresolver`] = "depker";
        // http
        labels[`traefik.http.routers.${config.name}-${this.id}-http.rule`] = rule;
        labels[`traefik.http.routers.${config.name}-${this.id}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${config.name}-${this.id}-http.middlewares`] = `${config.name}-${this.id}-https`;
        labels[`traefik.http.middlewares.${config.name}-${this.id}-https.redirectscheme.scheme`] = "https";
        middlewares.push(`${config.name}-${this.id}-https`);
      } else {
        // http
        labels[`traefik.http.routers.${config.name}-${this.id}.rule`] = rule;
        labels[`traefik.http.routers.${config.name}-${this.id}.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of config.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options ?? {})) {
          labels[`traefik.http.middlewares.${config.name}-${this.id}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${config.name}-${this.id}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${config.name}-${this.id}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    for (const port of config.ports ?? []) {
      const proto = port.proto;
      const hport = port.hport;
      const cport = port.cport;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${config.name}-${this.id}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${config.name}-${this.id}-${proto}-${cport}.entrypoints`] = `${proto}${hport}`;
      labels[`traefik.${proto}.routers.${config.name}-${this.id}-${proto}-${cport}.service`] = `${config.name}-${this.id}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${config.name}-${this.id}-${proto}-${cport}.loadbalancer.server.port`] = String(cport);
    }

    // volumes
    for (const volume of config.volumes ?? []) {
      const hpath = this._placeholder(volume.hpath, key => this.depker.config.path(key));
      const cpath = volume.cpath;
      const readonly = volume.readonly ? "ro" : "rw";
      options.Volumes = options.Volumes ?? [];
      options.Volumes.push(`${hpath}:${cpath}:${readonly}`);
    }

    // secrets
    if (config.secrets || config.labels) {
      const dotenvs = await dotenv.load();
      const secrets = await this.depker.config.secret(config.name);
      if (config.secrets) {
        for (const [key, val] of Object.entries(config.secrets)) {
          options.Envs = options.Envs ?? {};
          options.Envs[key] = this._placeholder(val, name => dotenvs[name] || secrets[name]);
        }
      }
      if (config.labels) {
        for (const [key, val] of Object.entries(config.labels)) {
          options.Labels = options.Labels ?? {};
          options.Labels[key] = this._placeholder(val, name => dotenvs[name] || secrets[name]);
        }
      }
    }

    try {
      // creating
      await this.depker.node.container.create(name, image, options);
      // starting
      await this.depker.node.container.start([name]);

      // wait healthcheck, max timeout 1h
      this.depker.log.info(`Waiting container ${name} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const infos = await this.depker.node.container.inspect([name]);
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

      this.depker.log.done(`Start container ${name} successfully.`);
    } catch (e) {
      // failure
      this.depker.log.error(`Start container ${name} failure.`, e);
      throw new Error(`Start container ${name} failure.`, { cause: e });
    } finally {
      // cleanup
      await this.depker.get<AppPlugin>(AppPlugin.NAME).prune("pre");
    }
  }

  public async deploy(apply?: (config: Config) => Promise<Config> | Config): Promise<void> {
    await this.build(apply);
    await this.start(apply);
  }

  private _placeholder(value: string, replacer: (name: string) => string | boolean | number | null | undefined) {
    // noinspection RegExpRedundantEscape
    return value.replace(/(?<=^|[^@])(?:@([a-z]\w*)|@\{([a-z][a-z0-9]*)\})/gi, (a, n) => {
      const r = replacer(n);
      return r === null || r === undefined ? a : String(r);
    });
  }

  private async _copy(source: string, target: string) {
    const _source = path.resolve(toPathString(source));
    const _target = path.resolve(toPathString(target));

    if (_source === _target) {
      throw new Error("Source and destination cannot be the same.");
    }

    const info = await Deno.lstat(_source);
    if (info.isDirectory && isSubdir(_source, _target)) {
      throw new Error(`Cannot copy '${_source}' to a subdirectory of itself, '${_target}'.`);
    }

    const ig = ignore() as any;
    const gi = path.join(_source, ".gitignore");
    const di = path.join(_source, ".depkerignore");
    if (await fs.exists(gi)) {
      ig.add(await Deno.readTextFile(gi));
    }
    if (await fs.exists(di)) {
      ig.add(await Deno.readTextFile(di));
    }

    const _options: CopyOptions = {
      filter: (p) => {
        const r = path.relative(source, p);
        return !r || !ig.ignores(r);
      },
    };

    if (info.isSymlink) {
      await this._copyLink(_source, _target, _options);
    } else if (info.isDirectory) {
      await this._copyDir(_source, _target, _options);
    } else if (info.isFile) {
      await this._copyFile(_source, _target, _options);
    }
  }

  private async _validCopy(source: string, target: string, options?: CopyOptions) {
    let info: Deno.FileInfo | undefined;
    try {
      info = await Deno.lstat(target);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return;
      }
      throw err;
    }
    if (options?.folder && !info.isDirectory) {
      throw new Error(`Cannot overwrite non-directory '${source}' with directory '${target}'.`);
    }
  }

  private async _copyLink(source: string, target: string, options?: CopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }
    await this._validCopy(source, target, options);
    const origin = await Deno.readLink(source);
    const type = getFileInfoType(await Deno.lstat(source));
    if (Deno.build.os === "windows") {
      await Deno.symlink(origin, target, { type: type === "dir" ? "dir" : "file" });
    } else {
      await Deno.symlink(origin, target);
    }
  }

  private async _copyDir(source: string, target: string, options?: CopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }

    await this._validCopy(source, target, { ...options, folder: true });
    await fs.ensureDir(target);

    source = toPathString(source);
    target = toPathString(target);

    for await (const entry of Deno.readDir(source)) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, path.basename(sourcePath));
      if (entry.isSymlink) {
        await this._copyLink(sourcePath, targetPath, options);
      } else if (entry.isDirectory) {
        await this._copyDir(sourcePath, targetPath, options);
      } else if (entry.isFile) {
        await this._copyFile(sourcePath, targetPath, options);
      }
    }
  }

  private async _copyFile(source: string, target: string, options?: CopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }
    await this._validCopy(source, target, options);
    await Deno.copyFile(source, target);
  }
}
