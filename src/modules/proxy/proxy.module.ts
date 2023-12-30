import { DepkerModule } from "../../types/modules.type.ts";
import { Command } from "../../deps.ts";
import { Depker } from "../../depker.ts";
import { defaults } from "./proxy.config.ts";
import { ProxyConfig } from "./proxy.type.ts";

export class ProxyModule implements DepkerModule {
  public static readonly NAME = "proxy";
  public static readonly IMAGE = "traefik:latest";

  constructor(private readonly depker: Depker) {}

  public get name() {
    return ProxyModule.NAME;
  }

  public async init(): Promise<void> {
    const proxy = new Command<Record<string, any>>().description("Manage proxy");
    const ports = new Command<Record<string, any>>().description("Manage ports");

    proxy.command("reload", "Reload a new proxy service").action(async () => {
      this.depker.log.step(`Reloading proxy service started.`);
      try {
        await this.reload();
        this.depker.log.done(`Reloading proxy service successfully.`);
      } catch (e) {
        this.depker.log.error(`Reloading proxy service failed.`, e);
      }
    });
    proxy
      .command("remove", "Remove proxy service")
      .option("-f, --force", "Force the removal of a running container (uses SIGKILL)")
      .action(async (options: Record<string, any>) => {
        this.depker.log.step(`Removing proxy service started.`);
        try {
          await this.depker.ops.container.remove([ProxyModule.NAME], { Force: options.force });
          this.depker.log.done(`Removing proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing proxy service failed.`, e);
        }
      });

    ports
      .command("list", "List proxy ports")
      .alias("ls")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options: Record<string, any>) => {
        try {
          const ports = await this.ports();
          if (options.json) {
            this.depker.log.json(ports);
          } else if (options.yaml) {
            this.depker.log.yaml(ports);
          } else {
            this.depker.log.table(
              ["Port"],
              ports.map((p) => [String(p)]),
            );
          }
        } catch (e) {
          this.depker.log.error(`Listing ports failed.`, e);
        }
      });
    ports
      .command("insert <port...:integer>", "Insert proxy ports")
      .alias("add")
      .action(async (_options: Record<string, any>, ...ports: number[]) => {
        this.depker.log.step(`Inserting ports started.`);
        try {
          await this.ports("insert", ports);
          this.depker.log.done(`Inserting ports successfully.`);
        } catch (e: any) {
          this.depker.log.error(`Inserting ports failed.`, e);
        }
      });
    ports
      .command("remove <port...:integer>", "Remove proxy ports")
      .alias("del")
      .action(async (_options: Record<string, any>, ...ports: number[]) => {
        this.depker.log.step(`Removing ports started.`);
        try {
          await this.ports("remove", ports);
          this.depker.log.done(`Removing ports successfully.`);
        } catch (e: any) {
          this.depker.log.error(`Removing ports failed.`, e);
        }
      });

    proxy.command("ports", ports);
    this.depker.cli.command("proxy", proxy);
    this.depker.cli.command("ports", ports);
  }

  // region public functions

  public async ports(operate?: "insert" | "remove", diffs?: number[]): Promise<number[]> {
    const config = await this.get();
    if (!operate || !diffs?.length) {
      return config.ports;
    }
    if (operate === "insert" && !diffs.find((p) => !config.ports.includes(p))) {
      return config.ports;
    }
    if (operate === "remove" && !diffs.find((p) => config.ports.includes(p))) {
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
    // prettier-ignore
    this.depker.log.debug(`The current port status does not match the requirements and is in the process of reloading proxy. current=${config.ports}, required=${diffs}`);
    await this.reload(config);
    return config.ports;
  }

  public async get(): Promise<ProxyConfig> {
    const config = await this.depker.cfg.config<Partial<ProxyConfig>>(ProxyModule.NAME);
    config.config = config.config ?? [];
    config.ports = config.ports ?? [];
    config.envs = config.envs ?? {};
    config.labels = config.labels ?? {};
    return config as ProxyConfig;
  }

  public async set(config: ProxyConfig): Promise<void> {
    config.config = config.config ?? [];
    config.ports = config.ports ?? [];
    config.envs = config.envs ?? {};
    config.labels = config.labels ?? {};
    await this.depker.cfg.config(ProxyModule.NAME, config);
  }

  public async reload(config?: ProxyConfig): Promise<void> {
    this.depker.log.debug(`Proxy reloading started.`);

    try {
      await this.depker.ops.container.remove([ProxyModule.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    if (config) {
      await this.set(config);
    } else {
      config = await this.get();
    }

    const options = new Set<string>();

    for (const value of defaults) {
      options.add(`--${value}`);
    }
    for (const value of config.config) {
      options.add(`--${value}`);
    }
    for (const value of config.ports) {
      options.add(`--entrypoints.tcp${value}.address=:${value}/tcp`);
      options.add(`--entrypoints.udp${value}.address=:${value}/udp`);
    }

    await this.depker.ops.container.run(ProxyModule.NAME, ProxyModule.IMAGE, {
      Detach: true,
      Restart: "always",
      Envs: config.envs,
      Labels: config.labels,
      Commands: [`traefik`, ...options],
      Networks: [await this.depker.ops.network.default()],
      Volumes: [`/var/depker/proxy:/etc/traefik`, `/var/run/docker.sock:/var/run/docker.sock`],
      Ports: [
        `80:80/tcp`,
        `443:443/tcp`,
        `443:443/udp`,
        ...config.ports.map((i) => `${i}:${i}/tcp`),
        ...config.ports.map((i) => `${i}:${i}/udp`),
      ],
    });

    this.depker.log.debug(`Proxy reloading successfully.`);
  }

  // endregion
}
