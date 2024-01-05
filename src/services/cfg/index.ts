import { Depker } from "../../depker.ts";
import { Configs, Secrets } from "./types.ts";
import { Command, yaml } from "../../deps.ts";

export * from "./types.ts";

export class CfgModule {
  public static readonly NAME: string = "config";
  public static readonly PATH: string = "config.yaml";
  public static readonly IMAGE: string = "alpine:latest";
  private readonly depker: Depker;
  private instance: Configs | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
    this.instance = undefined;

    // commands
    const config = new Command().description("Manage configs").alias("config").default("view");
    config
      .command("view", "View configs")
      .alias("show")
      .option("-f, --format <format:string>", "Pretty-print services using nunjucks template")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options) => {
        const data = await this.config();
        if (options.format) {
          this.depker.log.render(options.format, data);
        } else if (options.json) {
          this.depker.log.json(data);
        } else if (options.yaml) {
          this.depker.log.yaml(data);
        } else {
          this.depker.log.json(data);
        }
      });
    config
      .command("edit", "Edit configs")
      .option("-e, --editor <editor:string>", "Modify the file using a specific editor")
      .action(async (options) => {
        await this.manual(options.editor);
      });

    const secret = new Command().description("Manage secrets").alias("secret").default("list");
    secret
      .command("list", "List secrets")
      .alias("ls")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options) => {
        try {
          const secrets = await this.secret();
          if (options.json) {
            this.depker.log.json(secrets);
          } else if (options.yaml) {
            this.depker.log.yaml(secrets);
          } else {
            this.depker.log.table(
              ["Name", "Value"],
              Object.entries(secrets).map(([k, v]) => [k, String(v)] as const)
            );
          }
        } catch (e) {
          this.depker.log.error(`Listing secrets failed.`, e);
        }
      });
    secret
      .command("insert <name...:string>", "Insert secrets")
      .option("-s, --string <value:string>", "String value", { conflicts: ["number", "boolean", "null"] })
      .option("-n, --number <value:number>", "Number value", { conflicts: ["string", "boolean", "null"] })
      .option("-b, --boolean <value:boolean>", "Boolean value", { conflicts: ["string", "number", "null"] })
      .option("-u, --null", "Null value", { conflicts: ["string", "number", "boolean"] })
      .alias("add")
      .action(async (options, ...names) => {
        this.depker.log.step(`Inserting secrets started.`);
        try {
          const secrets = await this.secret();
          for (const name of names) {
            if (options.string !== undefined) {
              secrets[name] = options.string;
            } else if (options.number !== undefined) {
              secrets[name] = options.number;
            } else if (options.null) {
              secrets[name] = null;
            }
            await this.secret(secrets);
          }
          this.depker.log.done(`Inserting secrets successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting secrets failed.`, e);
        }
      });
    secret
      .command("remove <name...:string>", "Remove secrets")
      .alias("del")
      .action(async (_options, ...names) => {
        this.depker.log.step(`Removing secrets started.`);
        try {
          const secrets = await this.secret();
          for (const name of names) {
            delete secrets[name];
          }
          await this.secret(secrets);
          this.depker.log.done(`Removing secrets successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing secrets failed.`, e);
        }
      });

    this.depker.cli.command("configs", config);
    this.depker.cli.command("secrets", secret);
  }

  public path(name?: string) {
    if (name) {
      return `/var/depker${name.startsWith("/") ? name : `/${name}`}`;
    } else {
      return `/var/depker`;
    }
  }

  public async secret(secrets?: Secrets): Promise<Secrets> {
    if (secrets) {
      await this.config("secrets", secrets);
      return secrets;
    } else {
      return await this.config<Secrets>("secrets");
    }
  }

  public async config(): Promise<Configs>;
  public async config<T = Configs[string]>(name: string, value?: T | undefined | null): Promise<T>;
  public async config<T = Configs[string]>(name?: string, value?: T | undefined | null): Promise<Configs | T> {
    if (this.instance === undefined) {
      this.depker.log.debug(`Config loading started.`);
      try {
        this.instance = yaml.parse(await this.read(CfgModule.PATH)) as Configs;
        this.depker.log.debug(`Config loading successfully.`);
      } catch (e) {
        this.depker.log.debug(`Config loading failed.`, e);
      }
    }
    if (!this.instance) {
      this.instance = {};
    }
    if (name !== undefined && value !== undefined) {
      await this.depker.emit("depker:before-config", this.instance);
      if (value === null) {
        delete this.instance[name];
      } else {
        // @ts-ignore
        this.instance[name] = value;
      }
      await this.write(CfgModule.PATH, yaml.stringify(this.instance));
      await this.depker.emit("depker:after-config", this.instance);
    }
    if (name !== undefined) {
      return (this.instance[name] ?? {}) as T;
    }
    return this.instance ?? {};
  }

  public async manual(editor?: "vi" | "vim" | "nano" | string) {
    await this.depker.emit("depker:before-config", await this.config());
    await this.edit(CfgModule.PATH, editor);
    this.instance = undefined;
    await this.depker.emit("depker:after-config", await this.config());
  }

  public async edit(path: string, editor?: "vi" | "vim" | "nano" | string): Promise<void> {
    const commands = [`sh`, `-c`];
    if (editor) {
      commands.push(`apk add --no-cache ${editor} && ${editor} ${path}`);
    } else {
      commands.push(`vi ${path}`);
    }
    const exec = this.depker.ops.container.exec(CfgModule.NAME, commands, {
      Tty: true,
      Interactive: true,
      Workdir: `/var/depker`,
    });
    await exec.stdin("inherit").stdout("inherit").stderr("inherit").spawn();
  }

  public async read(path: string): Promise<string> {
    return await this.execute(`cat ${path}`);
  }

  public async write(path: string, data: string): Promise<void> {
    await this.execute(`mkdir -p $(dirname ${path}) && tee ${path}`, data);
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
        Volumes: [`/var/depker:/var/depker`],
        Commands: [`sleep`, `infinity`],
      });
    }
    const exec = this.depker.ops.container.exec(CfgModule.NAME, [`sh`, `-c`, command], {
      Interactive: true,
      Workdir: `/var/depker`,
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
