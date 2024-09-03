import path from "../deps/std/path.ts";
import yaml from "../deps/std/yaml.ts";
import dotenv from "../deps/std/dotenv.ts";
import collections from "../deps/std/collections.ts";
import { Depker } from "../depker.ts";
import { Command } from "../deps/jsr/command.ts";

export interface Config {
  ports: Array<number>;
  secrets: Record<string, Record<string, any>>;
  services: Record<string, Record<string, any>>;
}

export interface ProxyServiceConfig {
  args?: Array<string>;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
}

export class ConfigModule {
  private depker: Depker;
  private instance: Config | undefined;

  constructor(depker: Depker) {
    this.depker = depker;
    this.instance = undefined;

    // proxy
    const proxy = new Command().description("Manage proxy").default("view");
    proxy
      .command("restart", "Restart proxy service")
      .action(async () => {
        this.depker.log.step(`Restarting proxy service started.`);
        try {
          await this.restartProxy();
          this.depker.log.done(`Restarting proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Restarting proxy service failed.`, e);
        }
      });
    proxy
      .command("view", "View dynamic configs")
      .alias("show")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        const config = yaml.parse(await this.read("/proxy/config.yaml")) ?? {};
        if (options.json) {
          this.depker.log.json(config);
        } else {
          this.depker.log.yaml(config);
        }
      });
    proxy
      .command("edit", "Edit dynamic configs")
      .option("-e, --editor <editor:string>", "Modify the file using a specific editor")
      .action(async (options) => {
        await this.edit("/proxy/config.yaml", options.editor);
      });
    proxy
      .command("load <path:file>", "Load configs")
      .alias("import")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const config = await Deno.readTextFile(file);
        if (options.json || ext === ".json") {
          await this.write("/proxy/config.yaml", yaml.stringify(JSON.parse(config)));
        } else {
          await this.write("/proxy/config.yaml", yaml.stringify(yaml.parse(config)));
        }
      });
    proxy
      .command("save <path:file>", "Save configs")
      .alias("export")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const config = yaml.parse(await this.read("/proxy/config.yaml")) ?? {};
        if (options.json || ext === ".json") {
          await Deno.writeTextFile(file, JSON.stringify(config));
        } else {
          await Deno.writeTextFile(file, yaml.stringify(config));
        }
      });

    // config
    const config = new Command().description("Manage config").alias("config").alias("cfg").default("view");
    config
      .command("restart", "Restart config service")
      .action(async () => {
        this.depker.log.step(`Restarting proxy service started.`);
        try {
          await this.restartConfig();
          this.depker.log.done(`Restarting proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Restarting proxy service failed.`, e);
        }
      });
    config
      .command("view", "View configs")
      .alias("show")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        const data = await this.config();
        if (options.json) {
          this.depker.log.json(data);
        } else {
          this.depker.log.yaml(data);
        }
      });
    config
      .command("edit", "Edit configs")
      .option("-e, --editor <editor:string>", "Modify the file using a specific editor")
      .action(async (options) => {
        await this.depker.emit("depker:config:before-write", await this.config());
        await this.edit("config.yaml", options.editor);
        this.instance = undefined;
        await this.depker.emit("depker:config:after-write", await this.config());
      });
    config
      .command("load <path:file>", "Load configs")
      .alias("import")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, file) => {
        const ext = path.extname(file);
        const value = await Deno.readTextFile(file);
        if (options.json || ext === ".json") {
          await this.config(JSON.parse(value) as Config);
        } else {
          await this.config(yaml.parse(value) as Config);
        }
      });
    config
      .command("save <path:file>", "Save configs")
      .alias("export")
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

    // ports
    const ports = new Command().description("Manage ports").alias("port").alias("po");
    ports
      .command("list", "List proxy ports")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        try {
          const ports = await this.port();
          if (options.json) {
            this.depker.log.json(ports);
          } else if (options.yaml) {
            this.depker.log.yaml(ports);
          } else {
            this.depker.log.table(["Port"], ports.map(p => [String(p)]));
          }
        } catch (e) {
          this.depker.log.error(`Listing ports failed.`, e);
        }
      });
    ports
      .command("insert <port...:integer>", "Insert proxy ports")
      .alias("add")
      .alias("set")
      .action(async (_options, ...ports) => {
        this.depker.log.step(`Inserting ports started.`);
        try {
          await this.port((value) => {
            for (const port of ports) {
              value.add(port);
            }
            return value;
          });
          this.depker.log.done(`Inserting ports successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting ports failed.`, e);
        }
      });
    ports
      .command("remove <port...:integer>", "Remove proxy ports")
      .alias("del")
      .alias("unset")
      .action(async (_options, ...ports) => {
        this.depker.log.step(`Removing ports started.`);
        try {
          await this.port((value) => {
            for (const port of ports) {
              value.delete(port);
            }
            return value;
          });
          this.depker.log.done(`Removing ports successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing ports failed.`, e);
        }
      });

    // secrets
    const secrets = new Command().description("Manage secrets").alias("secret").alias("sec").default("list");
    secrets
      .command("list <app:string>", "List secrets")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, app) => {
        try {
          const secrets = await this.secret(app);
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
    secrets
      .command("insert <app:string> <key:string> <value:string>", "Insert secrets")
      .option("-s, --string", "String value", { conflicts: ["number", "boolean", "null"] })
      .option("-n, --number", "Number value", { conflicts: ["string", "boolean", "null"] })
      .option("-b, --boolean", "Boolean value", { conflicts: ["string", "number", "null"] })
      .option("-u, --null", "Null value", { conflicts: ["string", "number", "boolean"] })
      .alias("add")
      .alias("set")
      .action(async (options, app, key, value) => {
        this.depker.log.step(`Inserting secrets started.`);
        try {
          await this.secret(app, (secrets) => {
            if (options.string) {
              secrets[key] = String(value);
            } else if (options.number || /^-?\d+(?:\.\d*)?$/.test(value)) {
              secrets[key] = Number(value);
            } else if (options.boolean || /^true|on|yes|false|off|no$/i.test(value)) {
              secrets[key] = /^true|on|yes$/i.test(value);
            } else if (options.null || !value) {
              secrets[key] = null;
            } else {
              secrets[key] = String(value);
            }
            return secrets;
          });
          this.depker.log.done(`Inserting secrets successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting secrets failed.`, e);
        }
      });
    secrets
      .command("remove <app:string> <key...:string>", "Remove secrets")
      .alias("del")
      .alias("unset")
      .action(async (_options, app, ...keys) => {
        this.depker.log.step(`Removing secrets started.`);
        try {
          await this.secret(app, (secrets) => {
            for (const key of keys) {
              delete secrets[key];
            }
            return secrets;
          });
          this.depker.log.done(`Removing secrets successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing secrets failed.`, e);
        }
      });
    secrets
      .command("load <app:string> <path:file>", "Load secrets")
      .alias("import")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, app, file) => {
        const ext = path.extname(file);
        const value = await Deno.readTextFile(file);
        if (options.json || ext === ".json") {
          await this.secret(app, (secrets) => {
            for (const [key, val] of Object.entries(JSON.parse(value) as Record<string, any>)) {
              secrets[key] = val;
            }
            return secrets;
          });
        } else if (options.yaml || ext === ".yaml" || ext === ".yml") {
          await this.secret(app, (secrets) => {
            for (const [key, val] of Object.entries(yaml.parse(value) as Record<string, any>)) {
              secrets[key] = val;
            }
            return secrets;
          });
        } else {
          await this.secret(app, (secrets) => {
            for (const [key, val] of Object.entries(dotenv.parse(value))) {
              secrets[key] = val;
            }
            return secrets;
          });
        }
      });
    secrets
      .command("save <app:string> <path:file>", "Save secrets")
      .alias("export")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, app, file) => {
        const ext = path.extname(file);
        const config = await this.secret(app);
        if (options.json || ext === ".json") {
          await Deno.writeTextFile(file, JSON.stringify(config));
        } else if (options.yaml || ext === ".yaml" || ext === ".yml") {
          await Deno.writeTextFile(file, yaml.stringify(config));
        } else {
          const values = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, String(v)]));
          await Deno.writeTextFile(file, dotenv.stringify(values));
        }
      });

    this.depker.cli.command("proxy", proxy);
    this.depker.cli.command("ports", ports);
    this.depker.cli.command("secrets", secrets);
    this.depker.cli.command("configs", config);
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

  public async port(apply?: (value: Set<number>) => Set<number>): Promise<number[]> {
    const config = await this.config();
    if (apply) {
      const olds = new Set(config.ports);
      const news = apply(new Set(config.ports));
      const diffs = olds.symmetricDifference(news);
      if (diffs.size) {
        this.depker.log.debug(`The current port status does not match the requirements and is in the process of restarting proxy. current=${config.ports}, required=${diffs}`);
        config.ports = [...news];
        await this.config(config);
        await this.restartProxy();
      }
    }
    return config.ports;
  }

  public async secret<T extends Record<string, any>>(name: string, apply?: (value: T) => T): Promise<T> {
    const config = await this.config();
    if (apply) {
      config.secrets[name] = apply((config.secrets[name] ?? {}) as T);
      await this.config(config);
    }
    return collections.deepMerge({}, config.secrets[name] ?? {}) as T;
  }

  public async service<T extends Record<string, any>>(name: string, apply?: (value: T) => T): Promise<T> {
    const config = await this.config();
    if (apply) {
      config.services[name] = apply((config.services[name] ?? {}) as T);
      await this.config(config);
    }
    return collections.deepMerge({}, config.services[name] ?? {}) as T;
  }

  public async config(config?: Config): Promise<Config> {
    if (!this.instance) {
      this.depker.log.debug(`Start loading configuration.`);
      try {
        this.instance = yaml.parse(await this.read("config.yaml")) as Config;
        this.depker.log.debug(`Configuration has been restarted successfully.`);
      } catch (e) {
        this.depker.log.debug(`Configuration has been restarted failed.`, e);
      }
    }
    if (this.instance) {
      this.instance = {
        ports: this.instance.ports ?? [],
        secrets: this.instance.secrets ?? {},
        services: this.instance.services ?? {},
      };
    } else {
      this.instance = {
        ports: [],
        secrets: {},
        services: {},
      };
    }
    if (config) {
      await this.depker.emit("depker:config:before-write");
      this.instance = config;
      await this.write("config.yaml", yaml.stringify(this.instance));
      await this.depker.emit("depker:config:after-write");
    }
    // @ts-expect-error
    return collections.deepMerge({}, this.instance ?? {});
  }

  public async exec(command: string, inputs?: string): Promise<string> {
    const find = await this.depker.node.container.find("config");
    if (!find) {
      await this.restartConfig();
    }
    const exec = this.depker.node.container.exec("config", [`sh`, `-c`, command], {
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

  public async edit(path: string, editor?: "vi" | "vim" | "nano" | string): Promise<void> {
    path = this.path(path);
    const commands = [`sh`, `-c`];
    if (editor) {
      commands.push(`apk add --no-cache ${editor} && mkdir -p $(dirname ${path}) && ${editor} ${path}`);
    } else {
      commands.push(`mkdir -p $(dirname ${path}) && vi ${path}`);
    }
    const exec = this.depker.node.container.exec("config", commands, {
      Tty: true,
      Interactive: true,
      Workdir: `/var/depker`,
    });
    await exec.stdin("inherit").stdout("inherit").stderr("inherit").spawn();
  }

  public async read(path: string): Promise<string> {
    path = this.path(path);
    return await this.exec(`cat ${path} 2>/dev/null || true`);
  }

  public async write(path: string, data: string): Promise<void> {
    path = this.path(path);
    await this.exec(`mkdir -p $(dirname ${path}) && tee ${path}`, data);
  }

  public async remove(path: string): Promise<void> {
    path = this.path(path);
    await this.exec(`rm -rf ${path} 2>/dev/null`);
  }

  public async restartProxy() {
    await this.depker.emit("depker:proxy:before-restart");
    this.depker.log.debug(`Start restarting proxy service.`);

    const ports = await this.port();
    const configs = await this.service<ProxyServiceConfig>("proxy");
    const options = new Set<string>();
    options.add(`--api`);
    options.add(`--ping`);
    options.add(`--serverstransport.insecureskipverify=true`);
    options.add(`--serverstransport.maxidleconnsperhost=250`);
    options.add(`--entrypoints.http.address=:80`);
    options.add(`--entrypoints.https.address=:443`);
    options.add(`--providers.file.watch=true`);
    options.add(`--providers.file.filename=/etc/traefik/config.yaml`);
    options.add(`--providers.docker.exposedbydefault=false`);
    options.add(`--providers.docker.endpoint=unix:///var/run/docker.sock`);
    options.add(`--certificatesresolvers.depker.acme.email=admin@example.com`);
    options.add(`--certificatesresolvers.depker.acme.httpchallenge.entrypoint=http`);
    options.add(`--certificatesresolvers.depker.acme.storage=/etc/traefik/acme.json`);
    for (const value of configs.args ?? []) {
      options.add(`--${value}`);
    }
    for (const value of ports) {
      options.add(`--entrypoints.tcp${value}.address=:${value}/tcp`);
      options.add(`--entrypoints.udp${value}.address=:${value}/udp`);
    }

    try {
      await this.depker.node.container.remove(["proxy"], { Force: true });
      // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) {
      // ignore
    }

    await this.depker.node.container.run("proxy", "traefik:latest", {
      Detach: true,
      Pull: "always",
      Restart: "always",
      Envs: configs.envs,
      Labels: configs.labels,
      Commands: [
        ...options,
      ],
      Networks: [
        await this.depker.node.network.default(),
      ],
      Volumes: [
        `/var/depker/proxy:/etc/traefik`,
        `/var/run/docker.sock:/var/run/docker.sock`,
      ],
      Ports: [
        `80:80/tcp`,
        `443:443/tcp`,
        `443:443/udp`,
        ...ports.map(i => `${i}:${i}/tcp`),
        ...ports.map(i => `${i}:${i}/udp`),
      ],
    });

    await this.depker.emit("depker:proxy:after-restart");
    this.depker.log.debug(`Proxy service has been restarted successfully.`);
  }

  public async restartConfig() {
    await this.depker.emit("depker:config:before-restart");
    this.depker.log.debug(`Start restarting config service.`);

    try {
      await this.depker.node.container.remove(["config"], { Force: true });
      // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) {
      // ignore
    }

    await this.depker.node.container.run("config", "alpine:latest", {
      Init: true,
      Detach: true,
      Pull: "always",
      Restart: "always",
      Volumes: [`/var/depker:/var/depker`],
      Commands: [`sleep`, `infinity`],
    });

    await this.depker.emit("depker:config:after-restart");
    this.depker.log.debug(`Proxy service has been restarted successfully.`);
  }
}
