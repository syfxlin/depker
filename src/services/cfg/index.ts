import { Depker } from "../../depker.ts";
import { command, dotenv, path, yaml } from "../../deps.ts";
import { Configs, Secrets } from "./types.ts";

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
    const config = new command.Command().description("Manage configs").alias("config").alias("cfg").default("view");
    config
      .command("view", "View configs")
      .alias("show")
      .option("-f, --format <format:string>", "Pretty-print using nunjucks template")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        const data = await this.config();
        if (options.format) {
          this.depker.log.render(options.format, data);
        } else if (options.json) {
          this.depker.log.json(data);
        } else {
          this.depker.log.yaml(data);
        }
      });
    config
      .command("edit", "Edit configs")
      .option("-e, --editor <editor:string>", "Modify the file using a specific editor")
      .action(async (options) => {
        await this.manual(options.editor);
      });
    config
      .command("load <path:file>", "Load configs")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const value = await Deno.readTextFile(file);
        if (options.json || ext === ".json") {
          await this.config(JSON.parse(value) as Configs);
        } else {
          await this.config(yaml.parse(value) as Configs);
        }
      });
    config
      .command("save <path:file>", "Save configs")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const config = await this.config();
        if (options.json || ext === ".json") {
          await Deno.writeTextFile(file, JSON.stringify(config));
        } else {
          await Deno.writeTextFile(file, yaml.stringify(config));
        }
      });

    const secret = new command.Command().description("Manage secrets").alias("secret").alias("sec").default("list");
    secret
      .command("list", "List secrets")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
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
              Object.entries(secrets).map(([k, v]) => [k, String(v)] as const),
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
    secret
      .command("load <path:file>", "Load secrets")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const value = await Deno.readTextFile(file);
        if (options.json || ext === ".json") {
          await this.secret(JSON.parse(value) as Secrets);
        } else if (options.yaml || ext === ".yaml" || ext === ".yml") {
          await this.secret(yaml.parse(value) as Secrets);
        } else {
          await this.secret(dotenv.parse(value));
        }
      });
    secret
      .command("save <path:file>", "Save secrets")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const config = await this.secret();
        if (options.json || ext === ".json") {
          await Deno.writeTextFile(file, JSON.stringify(config));
        } else if (options.yaml || ext === ".yaml" || ext === ".yml") {
          await Deno.writeTextFile(file, yaml.stringify(config));
        } else {
          const values = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, String(v)]));
          await Deno.writeTextFile(file, dotenv.stringify(values));
        }
      });

    this.depker.cli.command("configs", config);
    this.depker.cli.command("secrets", secret);
  }

  public path(path?: string) {
    if (!path) {
      return `/var/depker`;
    } else if (path.startsWith("/var/depker")) {
      return path;
    } else {
      return `/var/depker${path.startsWith("/") ? path : `/${path}`}`;
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
  public async config(config: Configs): Promise<Configs>;
  public async config<T = Configs[string]>(name: string, value?: T | undefined | null): Promise<T>;
  public async config<T = Configs[string]>(
    name?: string | Configs,
    value?: T | undefined | null,
  ): Promise<Configs | T> {
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
      if (typeof name === "string") {
        if (value === null) {
          delete this.instance[name];
        } else {
          // @ts-expect-error
          this.instance[name] = value;
        }
      } else {
        this.instance = name;
      }
      await this.write(CfgModule.PATH, yaml.stringify(this.instance));
      await this.depker.emit("depker:after-config", this.instance);
    }
    if (name !== undefined && typeof name === "string") {
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
    path = this.path(path);
    const commands = [`sh`, `-c`];
    if (editor) {
      commands.push(`apk add --no-cache ${editor} && mkdir -p $(dirname ${path}) && ${editor} ${path}`);
    } else {
      commands.push(`mkdir -p $(dirname ${path}) && vi ${path}`);
    }
    const exec = this.depker.ops.container.exec(CfgModule.NAME, commands, {
      Tty: true,
      Interactive: true,
      Workdir: `/var/depker`,
    });
    await exec.stdin("inherit").stdout("inherit").stderr("inherit").spawn();
  }

  public async read(path: string): Promise<string> {
    path = this.path(path);
    return await this.execute(`cat ${path} 2>/dev/null || true`);
  }

  public async write(path: string, data: string): Promise<void> {
    path = this.path(path);
    await this.execute(`mkdir -p $(dirname ${path}) && tee ${path}`, data);
  }

  public async remove(path: string): Promise<void> {
    path = this.path(path);
    await this.execute(`rm -rf ${path} 2>/dev/null`);
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
