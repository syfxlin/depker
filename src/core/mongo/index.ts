import generator from "../../deps/jsr/password.ts";
import { Command } from "../../deps/jsr/command.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";

export interface MongoServiceConfig {
  username: string;
  password: string;
  version?: string;
  publish?: boolean;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  databases?: Record<string, { username: string; password: string }>;
}

export function mongo() {
  return function mongo(depker: Depker) {
    return new MongoPlugin(depker);
  };
}

export class MongoPlugin implements DepkerPlugin {
  public static readonly NAME = "mongo";
  private readonly depker: Depker;
  private _installed: boolean | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
  }

  public async init() {
    const mongo = new Command().description("Manage MongoDB service").default("list");

    mongo.command("install", "Install the MongoDB service if it isn't installed")
      .action(async () => {
        this.depker.log.step(`Installing MongoDB service started.`);
        try {
          await this.install();
          this.depker.log.done(`Installing MongoDB service successfully.`);
        } catch (e) {
          this.depker.log.error(`Installing MongoDB service failed.`, e);
        }
      });
    mongo.command("uninstall", "Uninstall the MongoDB service")
      .action(async () => {
        this.depker.log.step(`Uninstalling MongoDB service started.`);
        try {
          await this.uninstall();
          this.depker.log.done(`Uninstalling MongoDB service successfully.`);
        } catch (e) {
          this.depker.log.error(`Uninstalling MongoDB service failed.`, e);
        }
      });
    mongo.command("reinstall", "Reinstall the MongoDB service")
      .action(async () => {
        this.depker.log.step(`Reinstalling MongoDB service started.`);
        try {
          await this.uninstall();
          await this.install();
          this.depker.log.done(`Reinstalling MongoDB service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reinstalling MongoDB service failed.`, e);
        }
      });
    mongo.command("console [name:string]", "Launch a MongoDB console as user")
      .action(async (_options, name) => {
        await this.console(name);
      });
    mongo.command("env [name:string]", "Get generated environment variables for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    mongo.command("url [name:string]", "Get url for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(await this.url(name));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    mongo.command("list", "List all databases")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        try {
          const infos = await this.list();
          if (options.json) {
            this.depker.log.json(infos);
          } else if (options.yaml) {
            this.depker.log.yaml(infos);
          } else {
            this.depker.log.table(["Database"], infos.map(i => [i]));
          }
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    mongo.command("create <name:string>", "Create a MongoDB database")
      .alias("add")
      .action(async (_options, name) => {
        this.depker.log.step(`Inserting database started.`);
        try {
          await this.create(name);
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
          this.depker.log.done(`Inserting database successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting database failed.`, e);
        }
      });
    mongo.command("delete <name:string>", "Delete specified MongoDB database")
      .alias("del")
      .action(async (_options, name) => {
        this.depker.log.step(`Removing database started.`);
        try {
          await this.delete(name);
          this.depker.log.done(`Removing database successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing database failed.`, e);
        }
      });
    mongo.command("link <name:string> <apps...:string>", "Give environment variable of database to apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Linking database started.`);
        try {
          await this.link(name, apps);
          this.depker.log.done(`Linking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Linking database failed.`, e);
        }
      });
    mongo.command("unlink <name:string> <apps...:string>", "Remove environment variable of database from apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Unlinking database started.`);
        try {
          await this.unlink(name, apps);
          this.depker.log.done(`Unlinking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Unlinking database failed.`, e);
        }
      });

    this.depker.cli.command("mongo", mongo);
  }

  public async exec(script: string | string[]) {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    const result = await this.depker.node.container.exec(MongoPlugin.NAME, [
      "mongosh",
      "--quiet",
      "--host=127.0.0.1",
      `--username=${config.username}`,
      `--password=${config.password}`,
    ], {
      Interactive: true,
    }).stdinText(typeof script === "string" ? script : script.join(";"));
    return result.stdout;
  }

  public async link(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (config.databases?.[name]) {
      const database = name;
      const username = config.databases[name].username;
      const password = config.databases[name].password;
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          value.MONGO_HOST = "mongo";
          value.MONGO_PORT = 27017;
          value.MONGO_NAME = database;
          value.MONGO_USER = username;
          value.MONGO_PASS = password;
          value.MONGO_URL = `mongodb://${value.MONGO_USER}:${value.MONGO_PASS}@${value.MONGO_HOST}:${value.MONGO_PORT}/${value.MONGO_NAME}`;
          return value;
        });
      }
    } else {
      throw new Error(`MongoDB database is not configured with name: ${name}`);
    }
  }

  public async unlink(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (config.databases?.[name]) {
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          delete value.MONGO_HOST;
          delete value.MONGO_PORT;
          delete value.MONGO_NAME;
          delete value.MONGO_USER;
          delete value.MONGO_PASS;
          delete value.MONGO_URL;
          return value;
        });
      }
    } else {
      throw new Error(`MongoDB database is not configured with name: ${name}`);
    }
  }

  public async list() {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    return Object.keys(config.databases ?? {});
  }

  public async create(name: string) {
    await this.required();

    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (config.databases?.[name]) {
      this.depker.log.info(`MongoDB database configured already exists with name: ${name}`);
      return;
    }

    const database = name;
    const username = name;
    const password = generator.generate();

    await this.exec(`
      use ${database};
      try {
        db.dropDatabase();
      } catch (e) {
      }
      use admin;
      try {
        db.dropUser("${username}");
      } catch (e) {
      }
      db.createUser({
        user: "${username}",
        pwd: "${password}",
        roles: [{ role: 'readWrite', db: "${name}" }]
      });
    `);

    config.databases = config.databases ?? {};
    config.databases[database] = { username, password };
    await this.depker.config.service(MongoPlugin.NAME, () => config);
  }

  public async delete(name: string) {
    await this.required();

    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (!config.databases?.[name]) {
      this.depker.log.info(`MongoDB database configured already not exists with name: ${name}`);
      return;
    }

    await this.exec(`
      use admin;
      db.dropUser("${name}");
      use ${name};
      db.dropDatabase();
    `);

    config.databases = config.databases ?? {};
    delete config.databases[name];
    await this.depker.config.service(MongoPlugin.NAME, () => config);
  }

  private async env(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (!name || name === config.username) {
      const value: Record<string, any> = {};
      value.MONGO_HOST = "mongo";
      value.MONGO_PORT = 27017;
      value.MONGO_NAME = name;
      value.MONGO_USER = config.username;
      value.MONGO_PASS = config.password;
      value.MONGO_URL = `mongodb://${value.MONGO_USER}:${value.MONGO_PASS}@${value.MONGO_HOST}:${value.MONGO_PORT}/${value.MONGO_NAME}`;
      return value;
    } else if (config.databases?.[name]) {
      const value: Record<string, any> = {};
      value.MONGO_HOST = "mongo";
      value.MONGO_PORT = 27017;
      value.MONGO_NAME = name;
      value.MONGO_USER = config.databases[name].username;
      value.MONGO_PASS = config.databases[name].password;
      value.MONGO_URL = `mongodb://${value.MONGO_USER}:${value.MONGO_PASS}@${value.MONGO_HOST}:${value.MONGO_PORT}/${value.MONGO_NAME}`;
      return value;
    } else {
      throw new Error(`MongoDB database is not configured with name: ${name}`);
    }
  }

  private async url(name?: string) {
    const value = await this.env(name);
    return value.PGSQL_URL as string;
  }

  private async console(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (!name || name === config.username) {
      await this.depker.node.container.exec(MongoPlugin.NAME, [
        "mongosh",
        "--quiet",
        "--host=127.0.0.1",
        `--username=${config.username}`,
        `--password=${config.password}`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else if (config.databases?.[name]) {
      await this.depker.node.container.exec(MongoPlugin.NAME, [
        "mongosh",
        "--quiet",
        "--host=127.0.0.1",
        `--username=${config.databases[name].username}`,
        `--password=${config.databases[name].password}`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else {
      throw new Error(`MongoDB database is not configured with name: ${name}`);
    }
  }

  public async installed() {
    if (this._installed === undefined) {
      this._installed = !!(await this.depker.node.container.find(MongoPlugin.NAME));
    }
    return this._installed;
  }

  public async required() {
    if (await this.installed()) {
      return;
    }
    throw new Error(`MongoDB service has not been installed, please install it then use it.`);
  }

  public async install() {
    if (await this.installed()) {
      this.depker.log.info(`MongoDB service is already installed.`);
      return;
    }

    await this.depker.emit("depker:mongo:before-install");
    this.depker.log.info(`Start installing MongoDB service.`);

    const config = await this.depker.config.service<MongoServiceConfig>(MongoPlugin.NAME);
    if (!config.username || !config.password) {
      config.username = "root";
      config.password = generator.generate();
      await this.depker.config.service(MongoPlugin.NAME, () => config);
    }

    await this.depker.node.container.run(
      MongoPlugin.NAME,
      config.version?.includes(":") ? config.version : `mongo:${config.version || "7"}`,
      {
        Detach: true,
        Pull: "always",
        Restart: "always",
        Labels: config.labels,
        Ports: config.publish ? ["27017:27017"] : [],
        Networks: [await this.depker.node.network.default()],
        Commands: ["sh", "-c", `([ ! -f "/etc/mongo/mongod.conf" ] && touch /etc/mongo/mongod.conf) || mongod --config /etc/mongo/mongod.conf`],
        Envs: {
          ...config.envs,
          MONGO_INITDB_ROOT_USERNAME: config.username,
          MONGO_INITDB_ROOT_PASSWORD: config.password,
        },
        Volumes: [
          `${this.depker.config.path("/mongo/data")}:/data/db`,
          `${this.depker.config.path("/mongo/config")}:/etc/mongo`,
        ],
      },
    );

    this._installed = true;
    await this.depker.emit("depker:mongo:after-install");
    this.depker.log.info(`MongoDB service has been installed successfully.`);
  }

  public async uninstall() {
    if (!(await this.installed())) {
      this.depker.log.info(`MongoDB service is already uninstalled.`);
      return;
    }

    await this.depker.emit("depker:mongo:before-uninstall");
    this.depker.log.info(`Start uninstalling MongoDB service.`);

    await this.depker.node.container.remove([MongoPlugin.NAME], { Force: true });

    this._installed = false;
    await this.depker.emit("depker:mongo:after-uninstall");
    this.depker.log.info(`MongoDB service has been uninstalled successfully.`);
  }
}
