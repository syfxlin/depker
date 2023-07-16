import { Dax, dax } from "./services/dax.service.ts";
import { CliService } from "./services/cli.service.ts";
import { LogService } from "./services/log.service.ts";
import { EvsService } from "./services/evs.service.ts";
import { UtiService } from "./services/uti.service.ts";
import { DepkerMaster } from "./types/master.type.ts";
import { DepkerRunner } from "./types/runner.type.ts";
import { DockerNode } from "./services/docker.node.ts";
import { OpsService } from "./services/ops.service.ts";
import { DepkerModule } from "./types/modules.type.ts";
import { fs, path } from "./deps.ts";

type DepkerCallback<T> = T | ((depker: DepkerApp) => T);

export function depker(): DepkerApp {
  return new Depker() as DepkerApp;
}

export class Depker {
  // runner
  private _master: DepkerMaster;
  private _runner: DepkerRunner;
  // service
  private readonly _dax: Dax;
  private readonly _cli: CliService;
  private readonly _log: LogService;
  private readonly _evs: EvsService;
  private readonly _ops: OpsService;
  private readonly _uti: UtiService;
  // module
  private readonly _modules: Array<DepkerModule>;

  constructor() {
    // service
    this._dax = dax();
    this._cli = new CliService(this);
    this._log = new LogService(this);
    this._evs = new EvsService(this);
    this._ops = new OpsService(this);
    this._uti = new UtiService(this);
    // runner
    this._master = new DockerNode(this);
    this._runner = this._master;
    // module
    this._modules = [];
  }

  public static async create(): Promise<DepkerApp> {
    const root = Deno.cwd();
    const paths = [
      path.join(root, "depker.config.ts"),
      path.join(root, ".depker/depker.config.ts"),
      path.join(root, "depker.config.js"),
      path.join(root, ".depker/depker.config.js"),
    ];
    for (const p of paths) {
      if (await fs.exists(p)) {
        const mod = await import(path.toFileUrl(p).toString());
        return mod?.default ?? mod;
      }
    }
    return new Depker() as DepkerApp;
  }

  public get dax(): Dax {
    return this._dax;
  }

  public get cli(): CliService {
    return this._cli;
  }

  public get log(): LogService {
    return this._log;
  }

  public get evs(): EvsService {
    return this._evs;
  }

  public get ops(): OpsService {
    return this._ops;
  }

  public get uti(): UtiService {
    return this._uti;
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

  public file(file: string, value?: string): string | undefined {
    file = path.resolve(file);
    if (value) {
      fs.ensureDirSync(path.dirname(file));
      Deno.writeTextFileSync(file, value);
      return value;
    } else if (fs.existsSync(file)) {
      return Deno.readTextFileSync(file);
    } else {
      return undefined;
    }
  }

  public exit(code?: number): void {
    Deno.exit(code);
  }

  public on(name: string, listener: (...args: any[]) => void): DepkerApp {
    this._evs.on(name, listener);
    return this as unknown as DepkerApp;
  }

  public once(name: string, listener: (...args: any[]) => void): DepkerApp {
    this._evs.once(name, listener);
    return this as unknown as DepkerApp;
  }

  public async off(name: string, listener: (...args: any[]) => void): Promise<DepkerApp> {
    await this._evs.off(name, listener);
    return this as unknown as DepkerApp;
  }

  public async emit(name: string, ...args: any[]): Promise<DepkerApp> {
    await this._evs.emit(name, ...args);
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

  public inject(name: string, value: any): DepkerApp {
    // @ts-ignore
    this[name] = value;
    return this as unknown as DepkerApp;
  }

  public dependency(name: string, builder: () => DepkerCallback<DepkerModule>): DepkerApp {
    if (!this._modules.find((i) => i.name === name)) {
      this.use(builder());
    }
    return this as unknown as DepkerApp;
  }

  public async execute(): Promise<void> {
    // prepare
    this._cli.option("--debug", "Enable debug mode", {
      global: true,
      default: false,
      action: (options) => {
        if (options.debug) {
          Deno.env.set("DEPKER_OPTION_DEBUG", "true");
        }
      },
    });
    this._cli.option("--timestamp", "Enable timestamp output", {
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
      await this._init_module();
      await this._cli.parse(Deno.args);
      await this._destroy_module();
    } catch (e) {
      this._log.error(e);
      Deno.exit(1);
    }
  }

  private async _init_module(): Promise<void> {
    for (const module of this._modules) {
      await module?.init?.();
    }
  }

  private async _destroy_module(): Promise<void> {
    for (const module of this._modules) {
      await module?.destroy?.();
    }
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DepkerApp extends Depker {}
}
