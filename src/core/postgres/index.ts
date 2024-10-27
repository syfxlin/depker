import generator from "../../deps/jsr/password.ts";
import { Command } from "../../deps/jsr/command.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";

export interface PostgresServiceConfig {
  username: string;
  password: string;
  version?: string;
  publish?: boolean;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  databases?: Record<string, { username: string; password: string }>;
}

export function postgres() {
  return function postgres(depker: Depker) {
    return new PostgresPlugin(depker);
  };
}

export class PostgresPlugin implements DepkerPlugin {
  public static readonly NAME = "postgres";
  private readonly depker: Depker;
  private _installed: boolean | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
  }

  public async init() {
    const postgres = new Command().description("Manage PostgreSQL service").default("list");

    postgres.command("install", "Install the PostgreSQL service if it isn't installed")
      .action(async () => {
        this.depker.log.step(`Installing PostgreSQL service started.`);
        try {
          await this.install();
          this.depker.log.done(`Installing PostgreSQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Installing PostgreSQL service failed.`, e);
        }
      });
    postgres.command("uninstall", "Uninstall the PostgreSQL service")
      .action(async () => {
        this.depker.log.step(`Uninstalling PostgreSQL service started.`);
        try {
          await this.uninstall();
          this.depker.log.done(`Uninstalling PostgreSQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Uninstalling PostgreSQL service failed.`, e);
        }
      });
    postgres.command("reinstall", "Reinstall the PostgreSQL service")
      .action(async () => {
        this.depker.log.step(`Reinstalling PostgreSQL service started.`);
        try {
          await this.uninstall();
          await this.install();
          this.depker.log.done(`Reinstalling PostgreSQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reinstalling PostgreSQL service failed.`, e);
        }
      });
    postgres.command("console [name:string]", "Launch a PostgreSQL console as user")
      .action(async (_options, name) => {
        await this.console(name);
      });
    postgres.command("env [name:string]", "Get generated environment variables for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    postgres.command("url [name:string]", "Get url for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(await this.url(name));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    postgres.command("list", "List all databases")
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
    postgres.command("create <name:string>", "Create a PostgreSQL database")
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
    postgres.command("delete <name:string>", "Delete specified PostgreSQL database")
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
    postgres.command("link <name:string> <apps...:string>", "Give environment variable of database to apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Linking database started.`);
        try {
          await this.link(name, apps);
          this.depker.log.done(`Linking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Linking database failed.`, e);
        }
      });
    postgres.command("unlink <name:string> <apps...:string>", "Remove environment variable of database from apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Unlinking database started.`);
        try {
          await this.unlink(name, apps);
          this.depker.log.done(`Unlinking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Unlinking database failed.`, e);
        }
      });

    this.depker.cli.command("postgres", postgres);
  }

  public async exec(script: string | string[]) {
    await this.required();
    const result = await this.depker.node.container.exec(
      PostgresPlugin.NAME,
      ["psql"],
      { User: "postgres", Interactive: true },
    ).stdinText(typeof script === "string" ? script : script.join(";"));
    return result.stdout;
  }

  public async link(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (config.databases?.[name]) {
      const database = name;
      const username = config.databases[name].username;
      const password = config.databases[name].password;
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          value.PGSQL_HOST = "postgres";
          value.PGSQL_PORT = 5432;
          value.PGSQL_NAME = database;
          value.PGSQL_USER = username;
          value.PGSQL_PASS = password;
          value.PGSQL_URL = `postgres://${value.PGSQL_USER}:${value.PGSQL_PASS}@${value.PGSQL_HOST}:${value.PGSQL_PORT}/${value.PGSQL_NAME}?sslmode=disable`;
          return value;
        });
      }
    } else {
      throw new Error(`PostgreSQL database is not configured with name: ${name}`);
    }
  }

  public async unlink(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (config.databases?.[name]) {
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          delete value.PGSQL_HOST;
          delete value.PGSQL_PORT;
          delete value.PGSQL_NAME;
          delete value.PGSQL_USER;
          delete value.PGSQL_PASS;
          delete value.PGSQL_URL;
          return value;
        });
      }
    } else {
      throw new Error(`PostgreSQL database is not configured with name: ${name}`);
    }
  }

  public async list() {
    await this.required();
    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    return Object.keys(config.databases ?? {});
  }

  public async create(name: string) {
    await this.required();

    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (config.databases?.[name]) {
      this.depker.log.info(`PostgreSQL database configured already exists with name: ${name}`);
      return;
    }

    const database = name;
    const username = name;
    const password = generator.generate(20, true, true, false);

    await this.exec([
      `DROP USER IF EXISTS ${username}`,
      `DROP DATABASE IF EXISTS ${database}`,
      `CREATE USER ${username} WITH ENCRYPTED PASSWORD '${password}'`,
      `CREATE DATABASE ${database}`,
      `GRANT ALL PRIVILEGES ON DATABASE ${database} TO ${username}`,
    ]);

    config.databases = config.databases ?? {};
    config.databases[database] = { username, password };
    await this.depker.config.service(PostgresPlugin.NAME, () => config);
  }

  public async delete(name: string) {
    await this.required();

    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (!config.databases?.[name]) {
      this.depker.log.info(`PostgreSQL database configured already not exists with name: ${name}`);
      return;
    }

    await this.exec([
      `DROP USER IF EXISTS ${name}`,
      `DROP DATABASE IF EXISTS ${name}`,
    ]);

    config.databases = config.databases ?? {};
    delete config.databases[name];
    await this.depker.config.service(PostgresPlugin.NAME, () => config);
  }

  private async env(name?: string) {
    await this.required();
    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (!name || name === config.username) {
      const value: Record<string, any> = {};
      value.PGSQL_HOST = "postgres";
      value.PGSQL_PORT = 5432;
      value.PGSQL_NAME = name;
      value.PGSQL_USER = config.username;
      value.PGSQL_PASS = config.password;
      value.PGSQL_URL = `postgres://${value.PGSQL_USER}:${value.PGSQL_PASS}@${value.PGSQL_HOST}:${value.PGSQL_PORT}/${value.PGSQL_NAME}?sslmode=disable`;
      return value;
    } else if (config.databases?.[name]) {
      const value: Record<string, any> = {};
      value.PGSQL_HOST = "postgres";
      value.PGSQL_PORT = 5432;
      value.PGSQL_NAME = name;
      value.PGSQL_USER = config.databases[name].username;
      value.PGSQL_PASS = config.databases[name].password;
      value.PGSQL_URL = `postgres://${value.PGSQL_USER}:${value.PGSQL_PASS}@${value.PGSQL_HOST}:${value.PGSQL_PORT}/${value.PGSQL_NAME}?sslmode=disable`;
      return value;
    } else {
      throw new Error(`PostgreSQL database is not configured with name: ${name}`);
    }
  }

  private async url(name?: string) {
    const value = await this.env(name);
    return value.PGSQL_URL as string;
  }

  private async console(name?: string) {
    await this.required();
    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (!name || name === config.username) {
      await this.depker.node.container.exec(PostgresPlugin.NAME, ["psql"], {
        Tty: true,
        User: "postgres",
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else if (config.databases?.[name]) {
      await this.depker.node.container.exec(PostgresPlugin.NAME, ["psql"], {
        Tty: true,
        User: "postgres",
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else {
      throw new Error(`PostgreSQL database is not configured with name: ${name}`);
    }
  }

  public async installed() {
    if (this._installed === undefined) {
      this._installed = !!(await this.depker.node.container.find(PostgresPlugin.NAME));
    }
    return this._installed;
  }

  public async required() {
    if (await this.installed()) {
      return;
    }
    throw new Error(`PostgreSQL service has not been installed, please install it then use it.`);
  }

  public async install() {
    if (await this.installed()) {
      this.depker.log.info(`PostgreSQL service is already installed.`);
      return;
    }

    await this.depker.emit("depker:postgres:before-install");
    this.depker.log.info(`Start installing PostgreSQL service.`);

    const config = await this.depker.config.service<PostgresServiceConfig>(PostgresPlugin.NAME);
    if (!config.username || !config.password) {
      config.username = "postgres";
      config.password = generator.generate(20, true, true, false);
      await this.depker.config.service(PostgresPlugin.NAME, () => config);
    }

    await this.depker.node.container.run(
      PostgresPlugin.NAME,
      config.version?.includes(":") ? config.version : `postgres:${config.version || "16-alpine"}`,
      {
        Detach: true,
        Pull: "always",
        Restart: "always",
        Labels: config.labels,
        Ports: config.publish ? ["5432:5432"] : [],
        Networks: [await this.depker.node.network.default()],
        Volumes: [`${this.depker.config.path("/postgres")}:/var/lib/postgresql/data`],
        Envs: {
          ...config.envs,
          POSTGRES_USER: config.username,
          POSTGRES_PASSWORD: config.password,
        },
      },
    );

    this._installed = true;
    await this.depker.emit("depker:postgres:after-install");
    this.depker.log.info(`PostgreSQL service has been installed successfully.`);
  }

  public async uninstall() {
    if (!(await this.installed())) {
      this.depker.log.info(`PostgreSQL service is already uninstalled.`);
      return;
    }

    await this.depker.emit("depker:postgres:before-uninstall");
    this.depker.log.info(`Start uninstalling PostgreSQL service.`);

    await this.depker.node.container.remove([PostgresPlugin.NAME], { Force: true });

    this._installed = false;
    await this.depker.emit("depker:postgres:after-uninstall");
    this.depker.log.info(`PostgreSQL service has been uninstalled successfully.`);
  }
}
