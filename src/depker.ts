import fs from "./deps/std/fs.ts";
import path from "./deps/std/path.ts";
import { DepkerMaster, DepkerRunner } from "./providers/types.ts";
import { ExecModule, createExec } from "./modules/exec.module.ts";
import { DockerNode } from "./providers/docker.ts";
import { CliModule } from "./modules/cli.module.ts";
import { LogModule } from "./modules/log.module.ts";
import { NodeModule } from "./modules/node.module.ts";
import { ConfigModule } from "./modules/config.module.ts";
import { EventsModule } from "./modules/events.module.ts";
import { app } from "./core/app/index.ts";
import { mongo } from "./core/mongo/index.ts";
import { mysql } from "./core/mysql/index.ts";
import { postgres } from "./core/postgres/index.ts";
import { redis } from "./core/redis/index.ts";

export interface DepkerHook<T = any> {
  (depker: Depker): T;
}

export interface DepkerPlugin {
  init?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
}

export class Depker {
  // info
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  // runner
  private _master: DepkerMaster;
  private _runner: DepkerRunner;
  private _plugins: Record<string, DepkerPlugin>;
  // service
  public readonly cli: CliModule;
  public readonly log: LogModule;
  public readonly exec: ExecModule;
  public readonly node: NodeModule;
  public readonly config: ConfigModule;
  public readonly events: EventsModule;

  private constructor() {
    // info
    this.name = "depker";
    this.version = "5.3.5";
    this.description = "Docker-based cloud deployment tool.";
    // service
    this.cli = new CliModule(this);
    this.log = new LogModule(this);
    this.exec = createExec();
    this.node = new NodeModule(this);
    this.events = new EventsModule(this);
    this.config = new ConfigModule(this);
    // register
    this._master = new DockerNode(this);
    this._runner = this._master;
    this._plugins = {};
    // plugins
    this.register(app());
    this.register(redis());
    this.register(mongo());
    this.register(mysql());
    this.register(postgres());
  }

  public static create(): Depker {
    // @ts-expect-error
    if (!globalThis.depker) {
      // @ts-expect-error
      globalThis.depker = new Depker() as Depker;
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
    this.events.on(name, listener);
    return this;
  }

  public once(name: string, listener: (...args: any[]) => void): Depker {
    this.events.once(name, listener);
    return this;
  }

  public async off(name: string, listener: (...args: any[]) => void): Promise<Depker> {
    await this.events.off(name, listener);
    return this;
  }

  public async emit(name: string, ...args: any[]): Promise<Depker> {
    await this.events.emit(name, ...args);
    return this;
  }

  public master(): DepkerMaster;
  public master(node: DepkerHook<DepkerMaster>): Depker;
  public master(node?: DepkerHook<DepkerMaster>): DepkerMaster | Depker {
    if (node) {
      this._master = typeof node === "function" ? node(this) : node;
      return this;
    } else {
      return this._master;
    }
  }

  public runner(): DepkerRunner;
  public runner(node: DepkerHook<DepkerRunner>): Depker;
  public runner(node?: DepkerHook<DepkerRunner>): DepkerRunner | Depker {
    if (node) {
      this._runner = typeof node === "function" ? node(this) : node;
      return this;
    } else {
      return this._runner;
    }
  }

  public get<P extends DepkerPlugin = DepkerPlugin>(name: string): P {
    if (!this._plugins) {
      this._plugins = {};
    }
    if (!this._plugins[name]) {
      throw new Error(`Not found plugin ${name}.`);
    }
    return this._plugins[name] as P;
  }

  public use(hook: DepkerHook): Depker {
    hook(this);
    return this;
  }

  public register(plugin: DepkerHook<DepkerPlugin>): Depker {
    if (!plugin.name) {
      throw new Error(`Unnamed plugin are not allowed to be loaded.`);
    }
    if (!this._plugins) {
      this._plugins = {};
    }
    if (!this._plugins[plugin.name]) {
      this._plugins[plugin.name] = plugin(this);
    }
    return this;
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
