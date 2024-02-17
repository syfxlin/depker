import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.1.0/cryptoRandomString.ts";
import { command, dax } from "../../deps.ts";
import { MongoConfig, SavedMongoConfig } from "./mongo.type.ts";

export function mongo() {
  return function mongo(depker: Depker) {
    return new MongoPlugin(depker);
  };
}

export class MongoPlugin implements DepkerPlugin {
  public static readonly NAME = "mongo";
  public static readonly IMAGE = "mongo:latest";

  constructor(private readonly depker: Depker) {}

  public async init(): Promise<void> {
    const mongo = new command.Command().description("Manage mongo");

    mongo
      .command("reload", "Reload a new mongo service")
      .action(async () => {
        this.depker.log.step(`Reloading mongo service started.`);
        try {
          await this.reload();
          this.depker.log.done(`Reloading mongo service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading mongo service failed.`, e);
        }
      });
    mongo
      .command("shell [...args]", "Use the Mongo Shell to operate the mongo service")
      .alias("sh")
      .useRawArgs()
      .action(async (_options, ...args) => {
        await this.exec(true, ...args)
          .stdin("inherit")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
    mongo
      .command("list", "List minio buckets")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        try {
          const buckets = await this.list();
          if (options.json) {
            this.depker.log.json(buckets);
          } else if (options.yaml) {
            this.depker.log.yaml(buckets);
          } else {
            this.depker.log.table(["Bucket"], buckets.map(b => [b]));
          }
        } catch (e) {
          this.depker.log.error(`Listing buckets failed.`, e);
        }
      });
    mongo
      .command("add <database...:string>", "Add mongo databases")
      .action(async (_options, ...databases) => {
        this.depker.log.step(`Adding databases started.`);
        try {
          for (let i = 0; i < databases.length; i++) {
            const data = await this.create(databases[i]);
            if (i !== 0) {
              this.depker.log.raw(`---`);
            }
            this.depker.log.yaml(data);
          }
          this.depker.log.done(`Adding databases successfully.`);
        } catch (e) {
          this.depker.log.error(`Adding databases failed.`, e);
        }
      });
    mongo
      .command("del <database...:string>", "Remove minio databases")
      .action(async (_options, ...databases) => {
        this.depker.log.step(`Removing databases started.`);
        try {
          for (const database of databases) {
            await this.remove(database);
          }
          this.depker.log.done(`Removing databases successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing databases failed.`, e);
        }
      });

    this.depker.cli.command("mongo", mongo);
  }

  public async list() {
    const lines = await this.exec("--eval", "show dbs").lines();
    return lines.map(i => i.replace(/^(\w+)\s+.+$/, "$1"));
  }

  public async create(name: string) {
    const user = `${name}`;
    const pass = cryptoRandomString({ length: 16, type: "alphanumeric" });
    const scripts = [
      `use admin;`,
      `db.createUser({ user: "${user}", pwd: "${pass}", roles: [{ role: 'readWrite', db: "${name}" }] });`,
    ];
    await this.exec().stdinText(scripts.join("\n"));
    return { database: name, username: user, password: pass };
  }

  public async remove(name: string) {
    const scripts = [
      `use admin;`,
      `db.dropUser("${name}")`,
    ];
    await this.exec().stdinText(scripts.join("\n"));
  }

  public exec(...commands: string[]): dax.CommandBuilder;
  public exec(tty: boolean, ...commands: string[]): dax.CommandBuilder;
  public exec(tty: string | boolean, ...commands: string[]): dax.CommandBuilder {
    if (typeof tty !== "boolean") {
      commands.unshift(tty);
    }
    return this.depker.ops.container.exec(
      MongoPlugin.NAME,
      [
        `sh`,
        `-c`,
        `mongosh mongodb://127.0.0.1 -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --quiet ${commands.map(i => dax.default.escapeArg(i)).join(" ")}`,
      ],
      { Interactive: true, Tty: typeof tty === "boolean" ? tty : false },
    );
  }

  public async reload(config?: Omit<MongoConfig, "username" | "password">) {
    await this.depker.emit("mongo:before-reload", this);
    this.depker.log.debug(`Mongo reloading started.`);

    const saved: SavedMongoConfig = { ...await this.depker.cfg.config<SavedMongoConfig>(MongoPlugin.NAME), ...config };
    if (config || !saved.username || !saved.password) {
      saved.username = saved.username ?? "root";
      saved.password = saved.password ?? cryptoRandomString({ length: 16, type: "alphanumeric" });
      await this.depker.cfg.config(MongoPlugin.NAME, saved);
    }

    try {
      await this.depker.ops.container.remove([MongoPlugin.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    await this.depker.ops.container.run(MongoPlugin.NAME, MongoPlugin.IMAGE, {
      Detach: true,
      Pull: "always",
      Restart: "always",
      Labels: saved.labels,
      Networks: [await this.depker.ops.network.default()],
      Envs: {
        ...saved.envs,
        MONGO_INITDB_ROOT_USERNAME: saved.username,
        MONGO_INITDB_ROOT_PASSWORD: saved.password,
      },
      Ports: [
        ...(saved.port ? [`${saved.port}:27017`] : []),
        ...(saved.ports ?? []),
      ],
      Volumes: [
        `/var/depker/mongo:/data/db`,
        ...(saved.volumes ?? []),
      ],
    });

    await this.depker.emit("mongo:after-reload", this);
    this.depker.log.debug(`Mongo reloading successfully.`);
  }
}
