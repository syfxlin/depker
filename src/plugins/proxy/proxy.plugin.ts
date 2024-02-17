import { command } from "../../deps.ts";
import { defaults } from "./proxy.config.ts";
import { ProxyConfig } from "./proxy.type.ts";

export function proxy() {
  return function proxy(depker: Depker) {
    return new ProxyPlugin(depker);
  };
}

export class ProxyPlugin implements DepkerPlugin {
  public static readonly NAME = "proxy";
  public static readonly IMAGE = "traefik:latest";

  constructor(private readonly depker: Depker) {}

  public async init(): Promise<void> {
    const proxy = new command.Command().description("Manage proxy");
    const ports = new command.Command().description("Manage ports").alias("port").alias("po");

    proxy
      .command("reload", "Reload a new proxy service")
      .action(async () => {
        this.depker.log.step(`Reloading proxy service started.`);
        try {
          await this.reload();
          this.depker.log.done(`Reloading proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading proxy service failed.`, e);
        }
      });
    proxy
      .command("view", "View dynamic configs")
      .alias("show")
      .option("-f, --format <format:string>", "Pretty-print using nunjucks template")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        const data = await this.depker.cfg.read("/proxy/config.yaml");
        if (options.format) {
          this.depker.log.render(options.format, data);
        } else if (options.json) {
          this.depker.log.json(data);
        } else {
          this.depker.log.yaml(data);
        }
      });
    proxy
      .command("edit", "Edit dynamic configs")
      .option("-e, --editor <editor:string>", "Modify the file using a specific editor")
      .action(async (options) => {
        await this.depker.cfg.edit("/proxy/config.yaml", options.editor);
      });

    ports
      .command("reload", "Reload a new proxy service")
      .action(async () => {
        this.depker.log.step(`Reloading proxy service started.`);
        try {
          await this.reload();
          this.depker.log.done(`Reloading proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading proxy service failed.`, e);
        }
      });
    ports
      .command("list", "List proxy ports")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        try {
          const ports = await this.ports();
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
      .action(async (_options, ...ports) => {
        this.depker.log.step(`Inserting ports started.`);
        try {
          await this.ports("insert", ports);
          this.depker.log.done(`Inserting ports successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting ports failed.`, e);
        }
      });
    ports
      .command("remove <port...:integer>", "Remove proxy ports")
      .alias("del")
      .action(async (_options, ...ports) => {
        this.depker.log.step(`Removing ports started.`);
        try {
          await this.ports("remove", ports);
          this.depker.log.done(`Removing ports successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing ports failed.`, e);
        }
      });

    this.depker.cli.command("proxy", proxy);
    this.depker.cli.command("ports", ports);
  }

  // region public functions

  public async ports(operate?: "insert" | "remove", diffs?: number[]): Promise<number[]> {
    const config = await this.depker.cfg.config<Required<ProxyConfig>>(ProxyPlugin.NAME);
    config.ports = config.ports ?? [];
    if (!operate || !diffs?.length) {
      return config.ports;
    }
    if (operate === "insert" && !diffs.find(p => !config.ports.includes(p))) {
      return config.ports;
    }
    if (operate === "remove" && !diffs.find(p => config.ports.includes(p))) {
      return config.ports;
    }
    if (operate === "insert") {
      const ports = new Set<number>(config.ports);
      for (const port of diffs) {
        ports.add(port);
      }
      config.ports = [...ports];
    }
    if (operate === "remove") {
      const ports = new Set<number>(config.ports);
      for (const port of diffs) {
        ports.delete(port);
      }
      config.ports = [...ports];
    }
    this.depker.log.debug(`The current port status does not match the requirements and is in the process of reloading proxy. current=${config.ports}, required=${diffs}`);
    await this.reload(config);
    return config.ports;
  }

  public async reload(config?: ProxyConfig): Promise<void> {
    await this.depker.emit("proxy:before-reload", this);
    this.depker.log.debug(`Proxy reloading started.`);

    if (config) {
      await this.depker.cfg.config(ProxyPlugin.NAME, config);
    } else {
      config = await this.depker.cfg.config<ProxyConfig>(ProxyPlugin.NAME);
    }

    try {
      await this.depker.ops.container.remove([ProxyPlugin.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    const options = new Set<string>();
    for (const value of defaults) {
      options.add(`--${value}`);
    }
    for (const value of config.config ?? []) {
      options.add(`--${value}`);
    }
    for (const value of config.ports ?? []) {
      options.add(`--entrypoints.tcp${value}.address=:${value}/tcp`);
      options.add(`--entrypoints.udp${value}.address=:${value}/udp`);
    }
    await this.depker.ops.container.run(ProxyPlugin.NAME, ProxyPlugin.IMAGE, {
      Detach: true,
      Pull: "always",
      Restart: "always",
      Envs: config.envs,
      Labels: config.labels,
      Commands: [
        ...options,
      ],
      Networks: [
        await this.depker.ops.network.default(),
      ],
      Volumes: [
        `/var/depker/proxy:/etc/traefik`,
        `/var/run/docker.sock:/var/run/docker.sock`,
      ],
      Ports: [
        `80:80/tcp`,
        `443:443/tcp`,
        `443:443/udp`,
        ...(config.ports ?? []).map(i => `${i}:${i}/tcp`),
        ...(config.ports ?? []).map(i => `${i}:${i}/udp`),
      ],
    });

    await this.depker.emit("proxy:after-reload", this);
    this.depker.log.debug(`Proxy reloading successfully.`);
  }

  // endregion
}
