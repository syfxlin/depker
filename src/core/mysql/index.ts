import generator from "../../deps/jsr/password.ts";
import { Command } from "../../deps/jsr/command.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";

export interface MysqlServiceConfig {
  username: string;
  password: string;
  version?: string;
  publish?: boolean;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  databases?: Record<string, { username: string; password: string }>;
}

export function mysql() {
  return function mysql(depker: Depker) {
    return new MysqlPlugin(depker);
  };
}

export class MysqlPlugin implements DepkerPlugin {
  public static readonly NAME = "mysql";
  private readonly depker: Depker;
  private _installed: boolean | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
  }

  public async init() {
    const mysql = new Command().description("Manage MySQL service").default("list");

    mysql.command("install", "Install the MySQL service if it isn't installed")
      .action(async () => {
        this.depker.log.step(`Installing MySQL service started.`);
        try {
          await this.install();
          this.depker.log.done(`Installing MySQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Installing MySQL service failed.`, e);
        }
      });
    mysql.command("uninstall", "Uninstall the MySQL service")
      .action(async () => {
        this.depker.log.step(`Uninstalling MySQL service started.`);
        try {
          await this.uninstall();
          this.depker.log.done(`Uninstalling MySQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Uninstalling MySQL service failed.`, e);
        }
      });
    mysql.command("reinstall", "Reinstall the MySQL service")
      .action(async () => {
        this.depker.log.step(`Reinstalling MySQL service started.`);
        try {
          await this.uninstall();
          await this.install();
          this.depker.log.done(`Reinstalling MySQL service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reinstalling MySQL service failed.`, e);
        }
      });
    mysql.command("console [name:string]", "Launch a MySQL console as user")
      .action(async (_options, name) => {
        await this.console(name);
      });
    mysql.command("env [name:string]", "Get generated environment variables for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    mysql.command("url [name:string]", "Get url for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(await this.url(name));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    mysql.command("list", "List all databases")
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
    mysql.command("create <name:string>", "Create a MySQL database")
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
    mysql.command("delete <name:string>", "Delete specified MySQL database")
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
    mysql.command("link <name:string> <apps...:string>", "Give environment variable of database to apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Linking database started.`);
        try {
          await this.link(name, apps);
          this.depker.log.done(`Linking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Linking database failed.`, e);
        }
      });
    mysql.command("unlink <name:string> <apps...:string>", "Remove environment variable of database from apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Unlinking database started.`);
        try {
          await this.unlink(name, apps);
          this.depker.log.done(`Unlinking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Unlinking database failed.`, e);
        }
      });

    this.depker.cli.command("mysql", mysql);
  }

  public async exec(script: string | string[]) {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    const result = await this.depker.node.container.exec(MysqlPlugin.NAME, [
      "mysql",
      "--host=127.0.0.1",
      `--user=${config.username}`,
      `--password=${config.password}`,
    ], {
      Interactive: true,
    }).stdinText(typeof script === "string" ? script : script.join(";"));
    return result.stdout;
  }

  public async link(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (config.databases?.[name]) {
      const database = name;
      const username = config.databases[name].username;
      const password = config.databases[name].password;
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          value.MYSQL_HOST = "mysql";
          value.MYSQL_PORT = 3306;
          value.MYSQL_NAME = database;
          value.MYSQL_USER = username;
          value.MYSQL_PASS = password;
          value.MYSQL_URL = `mysql://${value.MYSQL_USER}:${value.MYSQL_PASS}@${value.MYSQL_HOST}:${value.MYSQL_PORT}/${value.MYSQL_NAME}`;
          return value;
        });
      }
    } else {
      throw new Error(`MySQL database is not configured with name: ${name}`);
    }
  }

  public async unlink(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (config.databases?.[name]) {
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          delete value.MYSQL_HOST;
          delete value.MYSQL_PORT;
          delete value.MYSQL_NAME;
          delete value.MYSQL_USER;
          delete value.MYSQL_PASS;
          delete value.MYSQL_URL;
          return value;
        });
      }
    } else {
      throw new Error(`MySQL database is not configured with name: ${name}`);
    }
  }

  public async list() {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    return Object.keys(config.databases ?? {});
  }

  public async create(name: string) {
    await this.required();

    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (config.databases?.[name]) {
      this.depker.log.info(`MySQL database configured already exists with name: ${name}`);
      return;
    }

    const database = name;
    const username = name;
    const password = generator.generate(20, true, true, false);

    await this.exec([
      `DROP USER IF EXISTS ${username}`,
      `DROP DATABASE IF EXISTS ${database}`,
      `CREATE USER '${username}'@'%' IDENTIFIED BY '${username}'`,
      `CREATE DATABASE ${database}`,
      `GRANT ALL PRIVILEGES ON ${database}.* TO '${username}'@'%'`,
      `FLUSH PRIVILEGES`,
    ]);

    config.databases = config.databases ?? {};
    config.databases[database] = { username, password };
    await this.depker.config.service(MysqlPlugin.NAME, () => config);
  }

  public async delete(name: string) {
    await this.required();

    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (!config.databases?.[name]) {
      this.depker.log.info(`MySQL database configured already not exists with name: ${name}`);
      return;
    }

    await this.exec([
      `DROP USER IF EXISTS ${name}`,
      `DROP DATABASE IF EXISTS ${name}`,
      `FLUSH PRIVILEGES`,
    ]);

    config.databases = config.databases ?? {};
    delete config.databases[name];
    await this.depker.config.service(MysqlPlugin.NAME, () => config);
  }

  private async env(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (!name || name === config.username) {
      const value: Record<string, any> = {};
      value.MYSQL_HOST = "mysql";
      value.MYSQL_PORT = 3306;
      value.MYSQL_NAME = name;
      value.MYSQL_USER = config.username;
      value.MYSQL_PASS = config.password;
      value.MYSQL_URL = `mysql://${value.MYSQL_USER}:${value.MYSQL_PASS}@${value.MYSQL_HOST}:${value.MYSQL_PORT}/${value.MYSQL_NAME}`;
      return value;
    } else if (config.databases?.[name]) {
      const value: Record<string, any> = {};
      value.MYSQL_HOST = "mysql";
      value.MYSQL_PORT = 3306;
      value.MYSQL_NAME = name;
      value.MYSQL_USER = config.databases[name].username;
      value.MYSQL_PASS = config.databases[name].password;
      value.MYSQL_URL = `mysql://${value.MYSQL_USER}:${value.MYSQL_PASS}@${value.MYSQL_HOST}:${value.MYSQL_PORT}/${value.MYSQL_NAME}`;
      return value;
    } else {
      throw new Error(`MySQL database is not configured with name: ${name}`);
    }
  }

  private async url(name?: string) {
    const value = await this.env(name);
    return value.MYSQL_URL as string;
  }

  private async console(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (!name || name === config.username) {
      await this.depker.node.container.exec(MysqlPlugin.NAME, [
        "mysql",
        "--host=127.0.0.1",
        `--user=${config.username}`,
        `--password=${config.password}`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else if (config.databases?.[name]) {
      await this.depker.node.container.exec(MysqlPlugin.NAME, [
        "mysql",
        "--host=127.0.0.1",
        `--user=${config.databases[name].username}`,
        `--password=${config.databases[name].password}`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else {
      throw new Error(`MySQL database is not configured with name: ${name}`);
    }
  }

  public async installed() {
    if (this._installed === undefined) {
      this._installed = !!(await this.depker.node.container.find(MysqlPlugin.NAME));
    }
    return this._installed;
  }

  public async required() {
    if (await this.installed()) {
      return;
    }
    throw new Error(`MySQL service has not been installed, please install it then use it.`);
  }

  public async install() {
    if (await this.installed()) {
      this.depker.log.info(`MySQL service is already installed.`);
      return;
    }

    await this.depker.emit("depker:mysql:before-install");
    this.depker.log.info(`Start installing MySQL service.`);

    const config = await this.depker.config.service<MysqlServiceConfig>(MysqlPlugin.NAME);
    if (!config.username || !config.password) {
      config.username = "root";
      config.password = generator.generate(20, true, true, false);
      await this.depker.config.service(MysqlPlugin.NAME, () => config);
    }

    await this.depker.node.container.run(
      MysqlPlugin.NAME,
      config.version?.includes(":") ? config.version : `mysql:${config.version || "lts"}`,
      {
        Detach: true,
        Pull: "always",
        Restart: "always",
        Labels: config.labels,
        Ports: config.publish ? ["3306:3306"] : [],
        Networks: [await this.depker.node.network.default()],
        Envs: {
          ...config.envs,
          MYSQL_ROOT_PASSWORD: config.password,
        },
        Volumes: [
          `${this.depker.config.path("/mysql/data")}:/var/lib/mysql`,
          `${this.depker.config.path("/mysql/config")}:/etc/mysql/conf.d`,
        ],
      },
    );

    this._installed = true;
    await this.depker.emit("depker:mysql:after-install");
    this.depker.log.info(`MySQL service has been installed successfully.`);
  }

  public async uninstall() {
    if (!(await this.installed())) {
      this.depker.log.info(`MySQL service is already uninstalled.`);
      return;
    }

    await this.depker.emit("depker:mysql:before-uninstall");
    this.depker.log.info(`Start uninstalling MySQL service.`);

    await this.depker.node.container.remove([MysqlPlugin.NAME], { Force: true });

    this._installed = false;
    await this.depker.emit("depker:mysql:after-uninstall");
    this.depker.log.info(`MySQL service has been uninstalled successfully.`);
  }
}
