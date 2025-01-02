import generator from "../../deps/jsr/password.ts";
import { Command } from "../../deps/jsr/command.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";

export interface RedisServiceConfig {
  username: string;
  password: string;
  version?: string;
  publish?: boolean;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  databases?: Record<string, { username: string; password: string }>;
}

export function redis() {
  return function redis(depker: Depker) {
    return new RedisPlugin(depker);
  };
}

export class RedisPlugin implements DepkerPlugin {
  public static readonly NAME = "redis";
  private readonly depker: Depker;
  private _installed: boolean | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
  }

  public async init() {
    const redis = new Command().description("Manage Redis service").default("list");

    redis.command("install", "Install the Redis service if it isn't installed")
      .action(async () => {
        this.depker.log.step(`Installing Redis service started.`);
        try {
          await this.install();
          this.depker.log.done(`Installing Redis service successfully.`);
        } catch (e) {
          this.depker.log.error(`Installing Redis service failed.`, e);
        }
      });
    redis.command("uninstall", "Uninstall the Redis service")
      .action(async () => {
        this.depker.log.step(`Uninstalling Redis service started.`);
        try {
          await this.uninstall();
          this.depker.log.done(`Uninstalling Redis service successfully.`);
        } catch (e) {
          this.depker.log.error(`Uninstalling Redis service failed.`, e);
        }
      });
    redis.command("reinstall", "Reinstall the Redis service")
      .action(async () => {
        this.depker.log.step(`Reinstalling Redis service started.`);
        try {
          await this.uninstall();
          await this.install();
          this.depker.log.done(`Reinstalling Redis service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reinstalling Redis service failed.`, e);
        }
      });
    redis.command("console [name:string]", "Launch a Redis console as user")
      .action(async (_options, name) => {
        await this.console(name);
      });
    redis.command("env [name:string]", "Get generated environment variables for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    redis.command("url [name:string]", "Get url for database")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(await this.url(name));
        } catch (e) {
          this.depker.log.error(`Listing databases failed.`, e);
        }
      });
    redis.command("list", "List all databases")
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
    redis.command("create <name:string>", "Create a Redis database")
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
    redis.command("delete <name:string>", "Delete specified Redis database")
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
    redis.command("link <name:string> <apps...:string>", "Give environment variable of database to apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Linking database started.`);
        try {
          await this.link(name, apps);
          this.depker.log.done(`Linking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Linking database failed.`, e);
        }
      });
    redis.command("unlink <name:string> <apps...:string>", "Remove environment variable of database from apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Unlinking database started.`);
        try {
          await this.unlink(name, apps);
          this.depker.log.done(`Unlinking database successfully.`);
        } catch (e) {
          this.depker.log.error(`Unlinking database failed.`, e);
        }
      });

    this.depker.cli.command("redis", redis);
  }

  public async exec(script: string | string[]) {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    const result = await this.depker.node.container.exec(RedisPlugin.NAME, [
      "redis-cli",
      "--user",
      config.username,
      "--pass",
      config.password,
    ], {
      Interactive: true,
    }).stdinText(typeof script === "string" ? script : script.join(";"));
    return result.stdout;
  }

  public async link(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (config.databases?.[name]) {
      const username = config.databases[name].username;
      const password = config.databases[name].password;
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          value.REDIS_HOST = "redis";
          value.REDIS_PORT = 6379;
          value.REDIS_NAME = 0;
          value.REDIS_USER = username;
          value.REDIS_PASS = password;
          value.REDIS_URL = `redis://${value.REDIS_USER}:${value.REDIS_PASS}@${value.REDIS_HOST}:${value.REDIS_PORT}/${value.REDIS_NAME}`;
          return value;
        });
      }
    } else {
      throw new Error(`Redis database is not configured with name: ${name}`);
    }
  }

  public async unlink(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (config.databases?.[name]) {
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          delete value.REDIS_HOST;
          delete value.REDIS_PORT;
          delete value.REDIS_NAME;
          delete value.REDIS_USER;
          delete value.REDIS_PASS;
          delete value.REDIS_URL;
          return value;
        });
      }
    } else {
      throw new Error(`Redis database is not configured with name: ${name}`);
    }
  }

  public async list() {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    return Object.keys(config.databases ?? {});
  }

  public async create(name: string) {
    await this.required();

    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (config.databases?.[name]) {
      this.depker.log.info(`Redis database configured already exists with name: ${name}`);
      return;
    }

    const username = name;
    const password = generator.generate(20, true, true, false);
    await this.exec(`ACL SETUSER ${username} on allkeys allchannels allcommands >'${password}'`);

    config.databases = config.databases ?? {};
    config.databases[name] = { username, password };
    await this.depker.config.service(RedisPlugin.NAME, () => config);
  }

  public async delete(name: string) {
    await this.required();

    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (!config.databases?.[name]) {
      this.depker.log.info(`Redis database configured already not exists with name: ${name}`);
      return;
    }

    await this.exec(`ACL DELUSER ${name}`);

    config.databases = config.databases ?? {};
    delete config.databases[name];
    await this.depker.config.service(RedisPlugin.NAME, () => config);
  }

  private async env(name?: string) {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (!name || name === config.username) {
      const value: Record<string, any> = {};
      value.REDIS_HOST = "redis";
      value.REDIS_PORT = 6379;
      value.REDIS_NAME = 0;
      value.REDIS_USER = config.username;
      value.REDIS_PASS = config.password;
      value.REDIS_URL = `redis://${value.REDIS_USER}:${value.REDIS_PASS}@${value.REDIS_HOST}:${value.REDIS_PORT}/${value.REDIS_NAME}`;
      return value;
    } else if (config.databases?.[name]) {
      const value: Record<string, any> = {};
      value.REDIS_HOST = "redis";
      value.REDIS_PORT = 6379;
      value.REDIS_NAME = 0;
      value.REDIS_USER = config.databases[name].username;
      value.REDIS_PASS = config.databases[name].password;
      value.REDIS_URL = `redis://${value.REDIS_USER}:${value.REDIS_PASS}@${value.REDIS_HOST}:${value.REDIS_PORT}/${value.REDIS_NAME}`;
      return value;
    } else {
      throw new Error(`Redis database is not configured with name: ${name}`);
    }
  }

  private async url(name?: string) {
    const value = await this.env(name);
    return value.REDIS_URL as string;
  }

  private async console(name?: string) {
    await this.required();
    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (!name || name === config.username) {
      await this.depker.node.container.exec(RedisPlugin.NAME, [
        "redis-cli",
        "--user",
        config.username,
        "--pass",
        config.password,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else if (config.databases?.[name]) {
      await this.depker.node.container.exec(RedisPlugin.NAME, [
        "redis-cli",
        "--user",
        config.databases[name].username,
        "--pass",
        config.databases[name].password,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else {
      throw new Error(`Redis database is not configured with name: ${name}`);
    }
  }

  public async installed() {
    if (this._installed === undefined) {
      this._installed = !!(await this.depker.node.container.find(RedisPlugin.NAME));
    }
    return this._installed;
  }

  public async required() {
    if (await this.installed()) {
      return;
    }
    throw new Error(`Redis service has not been installed, please install it then use it.`);
  }

  public async install() {
    if (await this.installed()) {
      this.depker.log.info(`Redis service is already installed.`);
      return;
    }

    await this.depker.emit("depker:redis:before-install");
    this.depker.log.info(`Start installing Redis service.`);

    const config = await this.depker.config.service<RedisServiceConfig>(RedisPlugin.NAME);
    if (!config.username || !config.password) {
      config.username = "default";
      config.password = generator.generate(20, true, true, false);
      await this.depker.config.service(RedisPlugin.NAME, () => config);
    }

    await this.depker.node.container.run(
      RedisPlugin.NAME,
      config.version?.includes(":") ? config.version : `redis:${config.version || "7-alpine"}`,
      {
        Detach: true,
        Pull: "always",
        Restart: "always",
        Labels: config.labels,
        Ports: config.publish ? ["6379:6379"] : [],
        Networks: [await this.depker.node.network.default()],
        Envs: {
          ...config.envs,
          REDIS_DEFAULT_USERNAME: config.username,
          REDIS_DEFAULT_PASSWORD: config.password,
        },
        Volumes: [
          `${this.depker.config.path("/redis/data")}:/data`,
          `${this.depker.config.path("/redis/config")}:/etc/redis`,
        ],
        EntryPoints: [
          "sh",
        ],
        Commands: [
          "-c",
          `([ ! -f "/etc/redis/redis.conf" ] && touch /etc/redis/redis.conf) || redis-server /etc/redis/redis.conf --requirepass $REDIS_DEFAULT_PASSWORD`,
        ],
        Healthcheck: {
          Period: "30s",
          Retries: "5",
          Timeout: "10s",
          Interval: "30s",
          Test: [
            "redis-cli",
            "--user",
            config.username,
            "--pass",
            config.password,
            "ping",
          ],
        },
      },
    );

    this._installed = true;
    await this.depker.emit("depker:redis:after-install");
    this.depker.log.info(`Redis service has been installed successfully.`);
  }

  public async uninstall() {
    if (!(await this.installed())) {
      this.depker.log.info(`Redis service is already uninstalled.`);
      return;
    }

    await this.depker.emit("depker:redis:before-uninstall");
    this.depker.log.info(`Start uninstalling Redis service.`);

    await this.depker.node.container.remove([RedisPlugin.NAME], { Force: true });

    this._installed = false;
    await this.depker.emit("depker:redis:after-uninstall");
    this.depker.log.info(`Redis service has been uninstalled successfully.`);
  }
}
