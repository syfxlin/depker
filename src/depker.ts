import { fs, path } from "./deps.ts";
import { Dax, createDax } from "./services/dax.service.ts";
import { DockerNode } from "./nodes/docker.ts";
import { proxy } from "./plugins/proxy/proxy.plugin.ts";
import { minio } from "./plugins/minio/minio.plugin.ts";
import { mongo } from "./plugins/mongo/mongo.plugin.ts";
import { service } from "./plugins/service/service.plugin.ts";
import { CliService } from "./services/cli.service.ts";
import { CfgService } from "./services/cfg.service.ts";
import { EvsService } from "./services/evs.service.ts";
import { LogService } from "./services/log.service.ts";
import { DepkerMaster, DepkerRunner, OpsService } from "./services/ops.service.ts";

declare global {
  type UseDepker<T> = (depker: Depker) => T;

  interface Depker extends DepkerInner {
    // NOOP
  }

  interface DepkerPlugin {
    init?: () => Promise<void> | void;
    destroy?: () => Promise<void> | void;
  }
}

export function depker(): Depker {
  return DepkerInner.create();
}

export function $depker(): Depker {
  return DepkerInner.create();
}

export class DepkerInner {
  // info
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  // runner
  private _master: DepkerMaster;
  private _runner: DepkerRunner;
  private _plugins: Record<string, DepkerPlugin>;
  // service
  public readonly dax: Dax;
  public readonly cli: CliService;
  public readonly cfg: CfgService;
  public readonly ops: OpsService;
  public readonly evs: EvsService;
  public readonly log: LogService;

  private constructor() {
    // info
    this.name = "depker";
    this.version = "5.3.0";
    this.description = "docker-based cloud deployment tool.";
    // service
    this.dax = createDax();
    this.cli = new CliService(this);
    this.cfg = new CfgService(this);
    this.ops = new OpsService(this);
    this.evs = new EvsService(this);
    this.log = new LogService(this);
    // register
    this._master = new DockerNode(this as unknown as Depker);
    this._runner = this._master;
    this._plugins = {};
    // plugins
    this.register(proxy());
    this.register(minio());
    this.register(mongo());
    this.register(service());
  }

  public static create(): Depker {
    // @ts-expect-error
    if (!globalThis.depker) {
      // @ts-expect-error
      globalThis.depker = new DepkerInner() as Depker;
    }
    // @ts-expect-error
    return globalThis.depker;
  }

  public cwd(dir?: string): string {
    if (dir) {
      Deno.chdir(dir);
    }
    return Deno.cwd();
  }

  public env(name: string, value?: string): string | undefined {
    if (value) {
      Deno.env.set(name, value);
      return value;
    } else {
      return Deno.env.get(name);
    }
  }

  public async file(file: string, value?: string): Promise<string | undefined> {
    file = path.resolve(file);
    if (value) {
      await fs.ensureDir(path.dirname(file));
      await Deno.writeTextFile(file, value);
      return value;
    } else if (await fs.exists(file)) {
      return await Deno.readTextFile(file);
    } else {
      return undefined;
    }
  }

  public async exit(code?: number): Promise<void> {
    await this.emit("depker:exit", code ?? 0, this);
    Deno.exit(code);
  }

  public on(name: string, listener: (...args: any[]) => void): Depker {
    this.evs.on(name, listener);
    return this as unknown as Depker;
  }

  public once(name: string, listener: (...args: any[]) => void): Depker {
    this.evs.once(name, listener);
    return this as unknown as Depker;
  }

  public async off(name: string, listener: (...args: any[]) => void): Promise<Depker> {
    await this.evs.off(name, listener);
    return this as unknown as Depker;
  }

  public async emit(name: string, ...args: any[]): Promise<Depker> {
    await this.evs.emit(name, ...args);
    return this as unknown as Depker;
  }

  public master(): DepkerMaster;
  public master(node: UseDepker<DepkerMaster>): Depker;
  public master(node?: UseDepker<DepkerMaster>): DepkerMaster | Depker {
    if (node) {
      this._master = typeof node === "function" ? node(this as unknown as Depker) : node;
      return this as unknown as Depker;
    } else {
      return this._master;
    }
  }

  public runner(): DepkerRunner;
  public runner(node: UseDepker<DepkerRunner>): Depker;
  public runner(node?: UseDepker<DepkerRunner>): DepkerRunner | Depker {
    if (node) {
      this._runner = typeof node === "function" ? node(this as unknown as Depker) : node;
      return this as unknown as Depker;
    } else {
      return this._runner;
    }
  }

  public inject(name: string, register: UseDepker<any>): Depker {
    // @ts-expect-error
    this[name] = register(this);
    return this as unknown as Depker;
  }

  public plugin<P extends DepkerPlugin = DepkerPlugin>(name: string): P {
    if (!this._plugins) {
      this._plugins = {};
    }
    if (!this._plugins[name]) {
      throw new Error(`Not found plugin ${name}.`);
    }
    return this._plugins[name] as P;
  }

  public register(plugin: UseDepker<DepkerPlugin>): Depker {
    if (!plugin.name) {
      throw new Error(`Unnamed plugin are not allowed to be loaded.`);
    }
    if (!this._plugins) {
      this._plugins = {};
    }
    if (!this._plugins[plugin.name]) {
      this._plugins[plugin.name] = plugin(this as unknown as Depker);
    }
    return this as unknown as Depker;
  }

  public async execute(): Promise<void> {
    try {
      await this._init();
      await this.cli.parse(Deno.args);
      await this._destroy();
    } catch (e) {
      this.log.error(e);
      await this.emit("depker:exit", 1, this);
      Deno.exit(1);
    }
  }

  private async _init(): Promise<void> {
    await this.emit("depker:before-init", this);
    await this._init_plugin();
    await this.emit("depker:after-init", this);
  }

  private async _destroy(): Promise<void> {
    await this.emit("depker:before-destroy", this);
    await this._destroy_plugin();
    await this.emit("depker:after-destroy", this);
  }

  private async _init_plugin(): Promise<void> {
    const plugins = this._plugins ?? {};
    await this.emit("depker:plugins:before-init", plugins);
    for (const plugin of Object.values(plugins)) {
      await this.emit("depker:plugin:before-init", plugin);
      await plugin?.init?.();
      await this.emit("depker:plugin:after-init", plugin);
    }
    await this.emit("depker:plugins:after-init", plugins);
  }

  private async _destroy_plugin(): Promise<void> {
    const plugins = this._plugins ?? {};
    await this.emit("depker:plugins:before-destroy", plugins);
    for (const plugin of Object.values(plugins)) {
      await this.emit("depker:plugin:before-destroy", plugin);
      await plugin?.destroy?.();
      await this.emit("depker:plugin:after-destroy", plugin);
    }
    await this.emit("depker:plugins:after-destroy", plugins);
  }
}
