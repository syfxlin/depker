import { DepkerModule } from "../../types/modules.type.ts";
import { Command } from "../../deps.ts";
import { ProxyConfig } from "./proxy.type.ts";
import { Depker } from "../../depker.ts";

export function proxy() {
  return (depker: Depker) => new ProxyModule(depker);
}

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

    proxy
      .command("init", "Init a new proxy service")
      .option("-m, --mail <mail:string>", "Email address used for registration")
      .option("-d, --provider <provider:string>", "Use a DNS-01 based challenge provider rather than HTTPS")
      .option("-p, --port <port:integer>", "Entry port for proxy", { collect: true })
      .option("-e, --env <env:string>", "Set environment variables", { collect: true })
      .option("-l, --label <label:string>", "Set label variables", { collect: true })
      .action(async (options: Record<string, any>) => {
        const config: ProxyConfig = {};
        if (options.mail) {
          config.mail = options.mail;
        }
        if (options.provider) {
          config.provider = options.provider;
        }
        if (options.port) {
          config.ports = options.port;
        }
        if (options.env) {
          config.envs = this.depker.uti.kv(options.env);
        }
        if (options.label) {
          config.labels = this.depker.uti.kv(options.label);
        }
        this.depker.log.step(`Reloading proxy service started.`);
        try {
          await this.reload(config);
          this.depker.log.done(`Reloading proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading proxy service failed.`, e);
        }
      });
    proxy
      .command("get", "Get proxy service config")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options: Record<string, any>) => {
        try {
          const config = await this.config();
          if (options.json) {
            this.depker.log.json(config);
          } else if (options.yaml) {
            this.depker.log.yaml(config);
          } else {
            this.depker.log.json(config);
          }
        } catch (e) {
          this.depker.log.error(`Getting proxy service config failed.`, e);
        }
      });
    proxy
      .command("set", "Set proxy service config")
      .option("-m, --mail <mail:string>", "Email address used for registration")
      .option("-d, --provider <provider:string>", "Use a DNS-01 based challenge provider rather than HTTPS")
      .option("-p, --port <port:integer>", "Entry port for proxy", { collect: true })
      .option("-e, --env <env:string>", "Set environment variables", { collect: true })
      .option("-l, --label <label:string>", "Set label variables", { collect: true })
      .action(async (options: Record<string, any>) => {
        const config = await this.config();
        if (options.mail) {
          config.mail = options.mail;
        }
        if (options.provider) {
          config.provider = options.provider;
        }
        if (options.port) {
          config.ports = options.port;
        }
        if (options.env) {
          config.envs = this.depker.uti.kv(options.env);
        }
        if (options.label) {
          config.labels = this.depker.uti.kv(options.label);
        }
        this.depker.log.step(`Setting proxy service started.`);
        try {
          await this.reload(config);
          this.depker.log.done(`Setting proxy service successfully.`);
        } catch (e) {
          this.depker.log.error(`Setting proxy service failed.`, e);
        }
      });
    proxy.command("reload", "Reload proxy service").action(async () => {
      this.depker.log.step(`Reloading proxy service started.`);
      try {
        await this.reload();
        this.depker.log.done(`Reloading proxy service successfully.`);
      } catch (e) {
        this.depker.log.error(`Reloading proxy service failed.`, e);
      }
    });
    proxy.command("start", "Start proxy service").action(async () => {
      this.depker.log.step(`Starting proxy service started.`);
      try {
        await this.depker.ops.container.start([ProxyModule.NAME]);
        this.depker.log.done(`Starting proxy service successfully.`);
      } catch (e) {
        this.depker.log.error(`Starting proxy service failed.`, e);
      }
    });
    proxy.command("stop", "Stop proxy service").action(async () => {
      this.depker.log.step(`Stopping proxy service started.`);
      try {
        await this.depker.ops.container.stop([ProxyModule.NAME]);
        this.depker.log.done(`Stopping proxy service successfully.`);
      } catch (e) {
        this.depker.log.error(`Stopping proxy service failed.`, e);
      }
    });
    proxy.command("restart", "Restart proxy service").action(async () => {
      this.depker.log.step(`Restarting proxy service started.`);
      try {
        await this.depker.ops.container.restart([ProxyModule.NAME]);
        this.depker.log.done(`Restarting proxy service successfully.`);
      } catch (e) {
        this.depker.log.error(`Restarting proxy service failed.`, e);
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
              ports.map((p) => [String(p)])
            );
          }
        } catch (e) {
          this.depker.log.error(`Listing ports failed.`, e);
        }
      });
    ports
      .command("insert <port...:integer>", "Insert proxy ports")
      .alias("add")
      .action(async (options: Record<string, any>, ...ports: number[]) => {
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
      .alias("rm")
      .alias("del")
      .action(async (options: Record<string, any>, ...ports: number[]) => {
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

  public async ports(operate?: "insert" | "remove", ports?: number[]) {
    const config = await this.config();
    const current = (config.ports ?? []).map((p) => parseInt(p));
    const set = new Set<number>(current);
    if (!operate || !ports?.length) {
      return [...set];
    }
    if (operate === "insert" && !ports.find((p) => !set.has(p))) {
      return [...set];
    }
    if (operate === "remove" && !ports.find((p) => set.has(p))) {
      return [...set];
    }
    if (operate === "insert") {
      for (const port of ports) {
        set.add(port);
      }
    }
    if (operate === "remove") {
      for (const port of ports) {
        set.delete(port);
      }
    }
    // prettier-ignore
    this.depker.log.debug(`The current port status does not match the requirements and is in the process of reloading proxy. current=${current}, required=${ports}`);
    const results = [...set];
    config.ports = results.map((p) => String(p));
    await this._create(config);
    return results;
  }

  public async config(): Promise<ProxyConfig> {
    try {
      const inspects = await this.depker.ops.container.inspect([ProxyModule.NAME]);
      if (inspects.length && inspects[0].Config.Labels["depker.config"]) {
        return JSON.parse(inspects[0].Config.Labels["depker.config"]);
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  public async reload(config?: ProxyConfig): Promise<void> {
    if (config) {
      await this._create(config);
    } else {
      await this._create(await this.config());
    }
  }

  private async _create(config: ProxyConfig): Promise<void> {
    this.depker.log.debug(`Proxy reloading started.`);

    // remove
    try {
      await this.depker.ops.container.remove([ProxyModule.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    // values
    await this.depker.ops.container.run(ProxyModule.NAME, ProxyModule.IMAGE, {
      Detach: true,
      Restart: "always",
      Networks: [await this.depker.ops.network.default()],
      Volumes: [`${ProxyModule.NAME}:/var/traefik`, `/var/run/docker.sock:/var/run/docker.sock`],
      Ports: [
        `80:80/tcp`,
        `443:443/tcp`,
        `443:443/udp`,
        ...(config.ports ?? []).map((p) => `${p}:${p}/tcp`),
        ...(config.ports ?? []).map((p) => `${p}:${p}/udp`),
      ],
      Labels: {
        "depker.config": JSON.stringify(config),
        ...config.labels,
      },
      Envs: {
        // dashboard
        TRAEFIK_API: "true",
        TRAEFIK_API_DASHBOARD: "true",
        // healthcheck
        TRAEFIK_PING: "true",
        // entry points
        TRAEFIK_ENTRYPOINTS_HTTP: "true",
        TRAEFIK_ENTRYPOINTS_HTTP_ADDRESS: ":80",
        TRAEFIK_ENTRYPOINTS_HTTPS: "true",
        TRAEFIK_ENTRYPOINTS_HTTPS_ADDRESS: ":443",
        ...(config.ports ?? []).reduce(
          (a, p) => ({
            [`TRAEFIK_ENTRYPOINTS_TCP${p}`]: "true",
            [`TRAEFIK_ENTRYPOINTS_TCP${p}_ADDRESS`]: `:${p}/tcp`,
            [`TRAEFIK_ENTRYPOINTS_UDP${p}`]: "true",
            [`TRAEFIK_ENTRYPOINTS_UDP${p}_ADDRESS`]: `:${p}/udp`,
          }),
          {}
        ),
        // providers
        TRAEFIK_PROVIDERS_DOCKER: "true",
        TRAEFIK_PROVIDERS_DOCKER_ENDPOINT: "unix:///var/run/docker.sock",
        TRAEFIK_PROVIDERS_DOCKER_EXPOSEDBYDEFAULT: "false",
        // certificates
        [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER`]: "true",
        [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_STORAGE`]: "/var/traefik/acme.json",
        ...(!config.mail
          ? {
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_EMAIL`]: `admin@example.com`,
            }
          : {
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_EMAIL`]: config.mail,
            }),
        ...(!config.provider || config.provider === "http"
          ? {
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_HTTPCHALLENGE`]: "true",
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_HTTPCHALLENGE_ENTRYPOINT`]: "http",
            }
          : {
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_DNSCHALLENGE`]: "true",
              [`TRAEFIK_CERTIFICATESRESOLVERS_DEPKER_ACME_DNSCHALLENGE_PROVIDER`]: config.provider,
            }),
        ...config.envs,
      },
    });

    this.depker.log.debug(`Proxy reloading successfully.`);
  }
}
