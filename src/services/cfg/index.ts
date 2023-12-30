import { Depker } from "../../depker.ts";
import { Configs, Secrets } from "./types.ts";
import { yaml } from "../../deps.ts";

export * from "./types.ts";

export class CfgModule {
  public static readonly NAME: string = "config";
  public static readonly PATH: string = "/var/depker";
  public static readonly IMAGE: string = "alpine:latest";
  private readonly depker: Depker;
  private instance: Configs | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
    this.instance = undefined;
  }

  public path(name?: string) {
    if (name) {
      return `${CfgModule.PATH}${name.startsWith("/") ? name.substring(1) : name}`;
    } else {
      return CfgModule.PATH;
    }
  }

  public async secret(): Promise<Secrets>;
  public async secret<T = Secrets[string]>(name: string, value?: T): Promise<T>;
  public async secret<T = Secrets[string]>(name?: string, value?: T): Promise<Configs | T> {
    const secrets = await this.config<Secrets>("secrets");
    if (name !== undefined && value !== undefined) {
      // @ts-ignore
      secrets[name] = value;
      await this.config("secrets", secrets);
    }
    if (name !== undefined) {
      return secrets[name] as T;
    }
    return secrets;
  }

  public async config(): Promise<Configs>;
  public async config<T = Configs[string]>(name: string, value?: T): Promise<T>;
  public async config<T = Configs[string]>(name?: string, value?: T): Promise<Configs | T> {
    if (this.instance === undefined) {
      this.depker.log.debug(`Config loading started.`);
      try {
        this.instance = yaml.parse(await this.read("/config.yaml")) as Configs;
        this.depker.log.debug(`Config loading successfully.`);
      } catch (e) {
        this.depker.log.debug(`Config loading failed.`, e);
      }
    }
    if (!this.instance) {
      this.instance = {};
    }
    if (name !== undefined && value !== undefined) {
      // @ts-ignore
      this.instance[name] = value;
      await this.write("/config.yaml", yaml.stringify(this.instance as Configs));
    }
    if (name !== undefined) {
      return (this.instance[name] ?? {}) as T;
    }
    return this.instance ?? {};
  }

  public async edit(path: string): Promise<void> {
    const exec = this.depker.ops.container.exec(CfgModule.NAME, [`sh`, `-c`, `vi ${path}`], {
      Tty: true,
      Interactive: true,
      Workdir: CfgModule.PATH,
    });
    await exec.stdin("inherit").stdout("inherit").stderr("inherit").spawn();
  }

  public async read(path: string): Promise<string> {
    return this.execute(`cat ${path}`);
  }

  public async write(path: string, data: string): Promise<void> {
    await this.execute(`mkdir -p ${path} && tee ${path}`, data);
  }

  public async remove(path: string): Promise<void> {
    await this.execute(`rm -rf ${path}`);
  }

  private async execute(command: string, inputs?: string): Promise<string> {
    const find = await this.depker.ops.container.find(CfgModule.NAME);
    if (!find) {
      await this.depker.ops.container.run(CfgModule.NAME, CfgModule.IMAGE, {
        Init: true,
        Detach: true,
        Restart: "always",
        Volumes: [`${CfgModule.PATH}:${CfgModule.PATH}`],
        Commands: [`sleep`, `infinity`],
      });
    }
    const exec = this.depker.ops.container.exec(CfgModule.NAME, [`sh`, `-c`, command], {
      Interactive: true,
      Workdir: CfgModule.PATH,
    });
    if (inputs) {
      const res = await exec.stdinText(inputs);
      return res.stdout;
    } else {
      const res = await exec;
      return res.stdout;
    }
  }
}
