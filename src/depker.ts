import "https://deno.land/std@0.210.0/dotenv/load.ts";
import { fs, path } from "./deps.ts";
import { Dax, dax } from "./services/dax/index.ts";
import { DockerNode } from "./services/docker/index.ts";
import { ProxyModule } from "./modules/proxy/proxy.module.ts";
import { ServiceModule } from "./modules/service/service.module.ts";
import { CliModule } from "./services/cli/index.ts";
import { LogModule } from "./services/log/index.ts";
import { OpsModule } from "./services/ops/index.ts";
import { UtiModule } from "./services/uti/index.ts";
import { EvsModule } from "./services/evs/index.ts";
import { CfgModule } from "./services/cfg/index.ts";
import { DepkerMaster, DepkerRunner } from "./services/docker/types.ts";

export type DepkerCallback<T> = T | ((depker: DepkerApp) => T);

export interface DepkerModule {
  name: string;
  init?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
}

export function depker(): DepkerApp {
  return Depker.create();
}

export class Depker {
  // singleton
  private static instance: DepkerApp;
  // info
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  // runner
  private _master: DepkerMaster;
  private _runner: DepkerRunner;
  // service
  public readonly dax: Dax;
  public readonly cli: CliModule;
  public readonly log: LogModule;
  public readonly ops: OpsModule;
  public readonly evs: EvsModule;
  public readonly uti: UtiModule;
  public readonly cfg: CfgModule;
  // module
  private readonly _modules: Array<DepkerModule>;

  public static create(): DepkerApp {
    if (!Depker.instance) {
      Depker.instance = new Depker() as DepkerApp;
    }
    return Depker.instance;
  }

  private constructor() {
    // info
    this.name = "depker";
    this.version = "5.1.2";
    this.description = "docker-based cloud deployment tool.";
    // service
    this.dax = dax();
    this.cli = new CliModule(this);
    this.log = new LogModule(this);
    this.ops = new OpsModule(this);
    this.evs = new EvsModule(this);
    this.uti = new UtiModule(this);
    this.cfg = new CfgModule(this);
    // runner
    this._master = new DockerNode(this);
    this._runner = this._master;
    // module
    this._modules = [];
    this._modules.push(new ProxyModule(this));
    this._modules.push(new ServiceModule(this));
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

  public on(name: string, listener: (...args: any[]) => void): DepkerApp {
    this.evs.on(name, listener);
    return this as unknown as DepkerApp;
  }

  public once(name: string, listener: (...args: any[]) => void): DepkerApp {
    this.evs.once(name, listener);
    return this as unknown as DepkerApp;
  }

  public async off(name: string, listener: (...args: any[]) => void): Promise<DepkerApp> {
    await this.evs.off(name, listener);
    return this as unknown as DepkerApp;
  }

  public async emit(name: string, ...args: any[]): Promise<DepkerApp> {
    await this.evs.emit(name, ...args);
    return this as unknown as DepkerApp;
  }

  public master(): DepkerMaster;
  public master(node: DepkerCallback<DepkerMaster>): DepkerApp;
  public master(node?: DepkerCallback<DepkerMaster>): DepkerMaster | DepkerApp {
    if (node) {
      this._master = typeof node === "function" ? node(this as unknown as DepkerApp) : node;
      return this as unknown as DepkerApp;
    } else {
      return this._master;
    }
  }

  public runner(): DepkerRunner;
  public runner(node: DepkerCallback<DepkerRunner>): DepkerApp;
  public runner(node?: DepkerCallback<DepkerRunner>): DepkerRunner | DepkerApp {
    if (node) {
      this._runner = typeof node === "function" ? node(this as unknown as DepkerApp) : node;
      return this as unknown as DepkerApp;
    } else {
      return this._runner;
    }
  }

  public module<M extends DepkerModule = DepkerModule>(name: string): M {
    const module = this._modules.find((i) => i.name === name);
    if (!module) {
      throw new Error(`Not found module ${name}`);
    }
    return module as M;
  }

  public use(module: DepkerCallback<DepkerModule>): DepkerApp {
    if (typeof module === "function") {
      this._modules.push(module(this as unknown as DepkerApp));
    } else {
      this._modules.push(module);
    }
    return this as unknown as DepkerApp;
  }

  public inject(name: string, builder: (depker: Depker) => any): DepkerApp {
    // @ts-ignore
    this[name] = builder(this);
    return this as unknown as DepkerApp;
  }

  public dependency(name: string, builder: (depker: Depker) => DepkerModule): DepkerApp {
    if (!this._modules.find((i) => i.name === name)) {
      this.use(builder(this));
    }
    return this as unknown as DepkerApp;
  }

  public async execute(): Promise<void> {
    // prepare
    this.cli.option("--debug", "Enable debug mode", {
      global: true,
      default: false,
      action: (options) => {
        if (options.debug) {
          Deno.env.set("DEPKER_OPTION_DEBUG", "true");
        }
      },
    });
    this.cli.option("--timestamp", "Enable timestamp output", {
      global: true,
      default: false,
      action: (options) => {
        if (options.timestamp) {
          Deno.env.set("DEPKER_OPTION_TIMESTAMP", "true");
        }
      },
    });

    // execute
    try {
      await this.emit("depker:before-init", this);
      await this._init_module();
      await this.emit("depker:after-init", this);
      await this.cli.parse(Deno.args);
      await this.emit("depker:before-destroy", this);
      await this._destroy_module();
      await this.emit("depker:after-destroy", this);
    } catch (e) {
      this.log.error(e);
      await this.emit("depker:exit", 1, this);
      Deno.exit(1);
    }
  }

  private async _init_module(): Promise<void> {
    await this.emit("depker:modules:before-init", this._modules);
    for (const module of this._modules) {
      await this.emit("depker:module:before-init", module);
      await module?.init?.();
      await this.emit("depker:module:after-init", module);
    }
    await this.emit("depker:modules:after-init", this._modules);
  }

  private async _destroy_module(): Promise<void> {
    await this.emit("depker:modules:before-destroy", this._modules);
    for (const module of this._modules) {
      await this.emit("depker:module:before-destroy", module);
      await module?.destroy?.();
      await this.emit("depker:module:after-destroy", module);
    }
    await this.emit("depker:modules:after-destroy", this._modules);
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DepkerApp extends Depker {}
}
