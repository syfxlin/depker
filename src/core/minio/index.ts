import generator from "../../deps/jsr/password.ts";
import { Command } from "../../deps/jsr/command.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";

export interface MinioServiceConfig {
  username: string;
  password: string;
  version?: string;
  publish?: boolean;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  buckets?: Record<string, { username: string; password: string }>;
}

export function minio() {
  return function minio(depker: Depker) {
    return new MinioPlugin(depker);
  };
}

export class MinioPlugin implements DepkerPlugin {
  public static readonly NAME = "minio";
  private readonly depker: Depker;
  private _installed: boolean | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
  }

  public async init() {
    const minio = new Command().description("Manage MinIO service").default("list");

    minio.command("install", "Install the MinIO service if it isn't installed")
      .action(async () => {
        this.depker.log.step(`Installing MinIO service started.`);
        try {
          await this.install();
          this.depker.log.done(`Installing MinIO service successfully.`);
        } catch (e) {
          this.depker.log.error(`Installing MinIO service failed.`, e);
        }
      });
    minio.command("uninstall", "Uninstall the MinIO service")
      .action(async () => {
        this.depker.log.step(`Uninstalling MinIO service started.`);
        try {
          await this.uninstall();
          this.depker.log.done(`Uninstalling MinIO service successfully.`);
        } catch (e) {
          this.depker.log.error(`Uninstalling MinIO service failed.`, e);
        }
      });
    minio.command("reinstall", "Reinstall the MinIO service")
      .action(async () => {
        this.depker.log.step(`Reinstalling MinIO service started.`);
        try {
          await this.uninstall();
          await this.install();
          this.depker.log.done(`Reinstalling MinIO service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reinstalling MinIO service failed.`, e);
        }
      });
    minio.command("console [name:string]", "Launch a MinIO console as user")
      .action(async (_options, name) => {
        await this.console(name);
      });
    minio.command("env [name:string]", "Get generated environment variables for bucket")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
        } catch (e) {
          this.depker.log.error(`Listing buckets failed.`, e);
        }
      });
    minio.command("url [name:string]", "Get url for bucket")
      .action(async (_options, name) => {
        try {
          this.depker.log.raw(await this.url(name));
        } catch (e) {
          this.depker.log.error(`Listing buckets failed.`, e);
        }
      });
    minio.command("list", "List all buckets")
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
            this.depker.log.table(["Bucket"], infos.map(i => [i]));
          }
        } catch (e) {
          this.depker.log.error(`Listing buckets failed.`, e);
        }
      });
    minio.command("create <name:string>", "Create a MinIO bucket")
      .alias("add")
      .action(async (_options, name) => {
        this.depker.log.step(`Inserting bucket started.`);
        try {
          await this.create(name);
          this.depker.log.raw(Object.entries(await this.env(name)).map(e => e.join("=")).join("\n"));
          this.depker.log.done(`Inserting bucket successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting bucket failed.`, e);
        }
      });
    minio.command("delete <name:string>", "Delete specified MinIO bucket")
      .alias("del")
      .action(async (_options, name) => {
        this.depker.log.step(`Removing bucket started.`);
        try {
          await this.delete(name);
          this.depker.log.done(`Removing bucket successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing bucket failed.`, e);
        }
      });
    minio.command("link <name:string> <apps...:string>", "Give environment variable of bucket to apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Linking bucket started.`);
        try {
          await this.link(name, apps);
          this.depker.log.done(`Linking bucket successfully.`);
        } catch (e) {
          this.depker.log.error(`Linking bucket failed.`, e);
        }
      });
    minio.command("unlink <name:string> <apps...:string>", "Remove environment variable of bucket from apps")
      .action(async (_options, name, ...apps) => {
        this.depker.log.step(`Unlinking bucket started.`);
        try {
          await this.unlink(name, apps);
          this.depker.log.done(`Unlinking bucket successfully.`);
        } catch (e) {
          this.depker.log.error(`Unlinking bucket failed.`, e);
        }
      });

    this.depker.cli.command("minio", minio);
  }

  public async exec(script: string | string[]) {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    const result = await this.depker.node.container.exec(MinioPlugin.NAME, [
      "sh",
      "-c",
      [`mc alias set minio http://localhost '${config.username}' '${config.password}'`, ...[script].flat()].join(" && "),
    ]);
    return result.stdout;
  }

  public async link(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (config.buckets?.[name]) {
      const bucket = name;
      const username = config.buckets[name].username;
      const password = config.buckets[name].password;
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          value.MINIO_HOST = "minio";
          value.MINIO_PORT = 9000;
          value.MINIO_NAME = bucket;
          value.MINIO_USER = username;
          value.MINIO_PASS = password;
          value.MINIO_URL = `minio://${value.MINIO_USER}:${value.MINIO_PASS}@${value.MINIO_HOST}:${value.MINIO_PORT}/${value.MINIO_NAME}`;
          return value;
        });
      }
    } else {
      throw new Error(`MinIO bucket is not configured with name: ${name}`);
    }
  }

  public async unlink(name: string, apps: string[]) {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (config.buckets?.[name]) {
      for (const app of apps) {
        await this.depker.config.secret(app, (value) => {
          delete value.MINIO_HOST;
          delete value.MINIO_PORT;
          delete value.MINIO_NAME;
          delete value.MINIO_USER;
          delete value.MINIO_PASS;
          delete value.MINIO_URL;
          return value;
        });
      }
    } else {
      throw new Error(`MinIO bucket is not configured with name: ${name}`);
    }
  }

  public async list() {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    return Object.keys(config.buckets ?? {});
  }

  public async create(name: string) {
    await this.required();

    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (config.buckets?.[name]) {
      this.depker.log.info(`MinIO bucket configured already exists with name: ${name}`);
      return;
    }

    const bucket = name;
    const username = name;
    const password = generator.generate(20, true, true, false);
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:*",
          ],
          Resource: [
            `arn:aws:s3:::${name}/*`,
          ],
        },
      ],
    });

    await this.exec([
      `mc mb --ignore-existing minio/${bucket}`,
      `echo '${policy}' > /tmp/minio-policy-${username}.json`,
      `mc admin user add minio ${username} ${password}`,
      `mc admin policy create minio ${username} /tmp/minio-policy-${username}.json`,
      `mc admin policy attach minio ${username} --user ${username}`,
    ]);

    config.buckets = config.buckets ?? {};
    config.buckets[bucket] = { username, password };
    await this.depker.config.service(MinioPlugin.NAME, () => config);
  }

  public async delete(name: string) {
    await this.required();

    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (!config.buckets?.[name]) {
      this.depker.log.info(`MinIO bucket configured already not exists with name: ${name}`);
      return;
    }

    await this.exec([
      `(mc admin policy detach minio ${name} --user ${name} 2>/dev/null || true)`,
      `(mc admin policy rm minio ${name} 2>/dev/null || true)`,
      `(mc rb --force minio/${name} 2>/dev/null || true)`,
    ]);

    config.buckets = config.buckets ?? {};
    delete config.buckets[name];
    await this.depker.config.service(MinioPlugin.NAME, () => config);
  }

  private async env(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (!name || name === config.username) {
      const value: Record<string, any> = {};
      value.MINIO_HOST = "minio";
      value.MINIO_PORT = 9000;
      value.MINIO_NAME = name;
      value.MINIO_USER = config.username;
      value.MINIO_PASS = config.password;
      value.MINIO_URL = `minio://${value.MINIO_USER}:${value.MINIO_PASS}@${value.MINIO_HOST}:${value.MINIO_PORT}/${value.MINIO_NAME}`;
      return value;
    } else if (config.buckets?.[name]) {
      const value: Record<string, any> = {};
      value.MINIO_HOST = "minio";
      value.MINIO_PORT = 9000;
      value.MINIO_NAME = name;
      value.MINIO_USER = config.buckets[name].username;
      value.MINIO_PASS = config.buckets[name].password;
      value.MINIO_URL = `minio://${value.MINIO_USER}:${value.MINIO_PASS}@${value.MINIO_HOST}:${value.MINIO_PORT}/${value.MINIO_NAME}`;
      return value;
    } else {
      throw new Error(`MinIO bucket is not configured with name: ${name}`);
    }
  }

  private async url(name?: string) {
    const value = await this.env(name);
    return value.MINIO_URL as string;
  }

  private async console(name?: string) {
    await this.required();
    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (!name || name === config.username) {
      await this.depker.node.container.exec(MinioPlugin.NAME, [
        "sh",
        "-c",
        `mc alias set minio http://localhost '${config.username}' '${config.password}' && bash`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else if (config.buckets?.[name]) {
      await this.depker.node.container.exec(MinioPlugin.NAME, [
        "sh",
        "-c",
        `mc alias set minio http://localhost '${config.buckets[name].username}' '${config.buckets[name].password}' && bash`,
      ], {
        Tty: true,
        Interactive: true,
      }).stdin("inherit").stdout("inherit").stderr("inherit");
    } else {
      throw new Error(`MinIO bucket is not configured with name: ${name}`);
    }
  }

  public async installed() {
    if (this._installed === undefined) {
      this._installed = !!(await this.depker.node.container.find(MinioPlugin.NAME));
    }
    return this._installed;
  }

  public async required() {
    if (await this.installed()) {
      return;
    }
    throw new Error(`MinIO service has not been installed, please install it then use it.`);
  }

  public async install() {
    if (await this.installed()) {
      this.depker.log.info(`MinIO service is already installed.`);
      return;
    }

    await this.depker.emit("depker:minio:before-install");
    this.depker.log.info(`Start installing MinIO service.`);

    const config = await this.depker.config.service<MinioServiceConfig>(MinioPlugin.NAME);
    if (!config.username || !config.password) {
      config.username = "root";
      config.password = generator.generate(20, true, true, false);
      await this.depker.config.service(MinioPlugin.NAME, () => config);
    }

    await this.depker.node.container.run(
      MinioPlugin.NAME,
      config.version?.includes(":") ? config.version : `minio/minio:${config.version || "RELEASE.2024-12-18T13-15-44Z"}`,
      {
        Detach: true,
        Pull: "always",
        Restart: "always",
        Labels: config.labels,
        Ports: config.publish ? ["9000:9000", "9001:9001"] : [],
        Networks: [await this.depker.node.network.default()],
        Envs: {
          ...config.envs,
          MINIO_ROOT_USER: config.username,
          MINIO_ROOT_PASSWORD: config.password,
        },
        Volumes: [
          `${this.depker.config.path("/minio")}:/data`,
        ],
        Commands: [
          "server",
          "/data",
          "--address",
          ":9000",
          "--console-address",
          ":9001",
        ],
        Healthcheck: {
          Period: "30s",
          Retries: "5",
          Timeout: "10s",
          Interval: "30s",
          Test: [
            "curl",
            "-f",
            "http://localhost:9000/minio/health/live",
          ],
        },
      },
    );

    this._installed = true;
    await this.depker.emit("depker:minio:after-install");
    this.depker.log.info(`MinIO service has been installed successfully.`);
  }

  public async uninstall() {
    if (!(await this.installed())) {
      this.depker.log.info(`MinIO service is already uninstalled.`);
      return;
    }

    await this.depker.emit("depker:minio:before-uninstall");
    this.depker.log.info(`Start uninstalling MinIO service.`);

    await this.depker.node.container.remove([MinioPlugin.NAME], { Force: true });

    this._installed = false;
    await this.depker.emit("depker:minio:after-uninstall");
    this.depker.log.info(`MinIO service has been uninstalled successfully.`);
  }
}
