import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DockerService } from "../services/docker.service";
import { BASE_DIR, LINUX_DIR } from "../constants/dir.constant";
import path from "path";
import fs from "fs-extra";
import YAML from "yaml";
import { DEPKER_CERT, DEPKER_LOGROTATE, DEPKER_SERVER, DEPKER_TRAEFIK } from "../constants/depker.constant";
import { SettingService } from "../services/setting.service";
import { LOGROTATE_IMAGE, TRAEFIK_IMAGE } from "../constants/docker.constant";
import deepmerge from "deepmerge";

@Injectable()
export class TraefikTask implements OnModuleInit {
  private readonly logger = new Logger(TraefikTask.name);

  constructor(private readonly settingService: SettingService, private readonly dockerService: DockerService) {}

  public async reload(force = false) {
    this.logger.log(`Reloading traefik and logrotate.`);

    // load config
    const setting = await this.settingService.get();

    // find exists container
    const containers = await this.dockerService.listContainers({ all: true });
    const server = containers.find((container) => container.Names.find((n) => n.startsWith(`/${DEPKER_SERVER}`)));

    // find traefik base dir
    let dir = path.posix.join(BASE_DIR, "traefik");
    if (server) {
      this.logger.log(`Depker is running inside docker.`);
      const base = server.Mounts.find((v) => v.Destination === LINUX_DIR(BASE_DIR));
      if (base) {
        dir = path.posix.join(base.Source, "traefik");
      }
    } else {
      this.logger.log(`Depker is running outside docker.`);
    }
    this.logger.log(`Traefik use dir: ${dir}`);

    // ensure dir
    fs.ensureDirSync(dir);
    fs.ensureDirSync(path.posix.join(dir, "conf.d"));

    const _traefik = async () => {
      await this.dockerService.pullImage(TRAEFIK_IMAGE, setting.upgrade);
      const traefik = containers.find((c) => c.Names.find((n) => n.startsWith(`/${DEPKER_TRAEFIK}`)));

      if (traefik) {
        if (force) {
          // if force reload, remove
          this.logger.log(`Recreating traefik with force reload.`);
          const container = await this.dockerService.getContainer(traefik.Id);
          await container.remove({ force: true });
        } else if (traefik.Status.includes("Exited")) {
          // if traefik container is exited, remove
          this.logger.log(`Recreating traefik with exited.`);
          const container = await this.dockerService.getContainer(traefik.Id);
          await container.remove({ force: true });
        } else {
          // if traefik container exists, restart
          this.logger.log(`Restarting traefik with running.`);
          const container = await this.dockerService.getContainer(traefik.Id);
          await container.restart();
          this.logger.log(`Traefik restart done.`);
          return;
        }
      }

      // values
      // prettier-ignore
      const ports = Array(setting.ports[1] - setting.ports[0] + 1).fill(setting.ports[0]).map((x, y) => x + y);
      const envs = Object.entries(setting.tls.env ?? {}).map(([k, v]) => `${k}=${v}`);

      // write config
      const traefikYaml = deepmerge(
        {
          log: {
            level: "INFO",
            filePath: "/var/traefik/traefik.log",
          },
          accessLog: {
            filePath: "/var/traefik/traefik-access.log",
            bufferingSize: 100,
          },
          api: {
            dashboard: true,
          },
          entryPoints: {
            http: {
              address: ":80",
            },
            https: {
              address: ":443",
            },
            ...ports.reduce(
              (a, p) => ({
                [`tcp${p}`]: { address: `:${p}/tcp` },
                [`udp${p}`]: { address: `:${p}/udp` },
              }),
              {}
            ),
          },
          providers: {
            file: {
              directory: "/var/traefik/conf.d",
              watch: true,
            },
            docker: {
              endpoint: "unix:///var/run/docker.sock",
              exposedByDefault: false,
            },
          },
          certificatesResolvers: {
            [DEPKER_CERT]: {
              acme: {
                email: setting.email,
                storage: "/var/traefik/acme.json",
                ...(setting.tls.type === "http"
                  ? {
                      httpChallenge: {
                        entryPoint: "http",
                      },
                    }
                  : {
                      dnsChallenge: {
                        provider: setting.tls,
                      },
                    }),
              },
            },
          },
        },
        setting.extension.traefik ?? {}
      );
      const dashboardYaml = deepmerge(
        {
          http: {
            routers: {
              traefik: {
                entryPoints: "https",
                rule: `Host(\`${setting.dashboard}\`)`,
                service: "api@internal",
                middlewares: ["traefik-auth"],
                tls: {
                  certResolver: DEPKER_CERT,
                },
              },
            },
            middlewares: {
              "traefik-auth": {
                basicAuth: {
                  users: [`${setting.username}:${setting.password}`],
                },
              },
            },
          },
        },
        setting.extension.dashboard ?? {}
      );
      fs.outputFileSync(path.posix.join(dir, "traefik.yml"), YAML.stringify(traefikYaml));
      if (setting.dashboard) {
        fs.outputFileSync(path.posix.join(dir, "conf.d", "dashboard.yml"), YAML.stringify(dashboardYaml));
      }

      // create traefik container
      const container = await this.dockerService.createContainer({
        name: DEPKER_TRAEFIK,
        Image: TRAEFIK_IMAGE,
        Cmd: ["--configFile=/var/traefik/traefik.yml"],
        Env: [`DEPKER_NAME=${DEPKER_TRAEFIK}`, ...envs],
        Labels: { "depker.name": DEPKER_TRAEFIK },
        ExposedPorts: {
          "80/tcp": {},
          "443/tcp": {},
          ...ports.reduce(
            (a, p) => ({
              ...a,
              [`${p}/tcp`]: {},
              [`${p}/udp`]: {},
            }),
            {}
          ),
        },
        HostConfig: {
          RestartPolicy: { Name: "always" },
          Binds: [`/var/run/docker.sock:/var/run/docker.sock`, `${LINUX_DIR(dir)}:/var/traefik`],
          PortBindings: {
            "80/tcp": [{ HostPort: "80" }],
            "443/tcp": [{ HostPort: "443" }],
            ...ports.reduce(
              (a, p) => ({
                ...a,
                [`${p}/tcp`]: [{ HostPort: `${p}` }],
                [`${p}/udp`]: [{ HostPort: `${p}` }],
              }),
              {}
            ),
          },
        },
      });

      // connect to depker network
      const network = await this.dockerService.depkerNetwork();
      await network.connect({ Container: container.id });

      // start container
      await container.start();

      this.logger.log(`Traefik started.`);
    };

    const _logrotate = async () => {
      await this.dockerService.pullImage(LOGROTATE_IMAGE, setting.upgrade);
      const logrotate = containers.find((c) => c.Names.find((n) => n.startsWith(`/${DEPKER_LOGROTATE}`)));

      if (logrotate) {
        if (force) {
          // if force reload, remove
          this.logger.log(`Recreating logrotate with force reload.`);
          const container = await this.dockerService.getContainer(logrotate.Id);
          await container.remove({ force: true });
        } else if (logrotate.Status.includes("Exited")) {
          // if logrotate container is exited, remove
          this.logger.log(`Recreating logrotate with exited.`);
          const container = await this.dockerService.getContainer(logrotate.Id);
          await container.remove({ force: true });
        } else {
          // if logrotate container exists, restart
          this.logger.log(`Restarting logrotate with running.`);
          const container = await this.dockerService.getContainer(logrotate.Id);
          await container.restart();
          this.logger.log(`Logrotate restart done.`);
          return;
        }
      }

      // create logrotate container
      const container = await this.dockerService.createContainer({
        name: DEPKER_LOGROTATE,
        Image: LOGROTATE_IMAGE,
        Env: [
          `DEPKER_NAME=${DEPKER_LOGROTATE}`,
          `LOGROTATE_LOGS=/var/traefik/*.log`,
          `LOGROTATE_TRIGGER_INTERVAL=weekly`,
          `LOGROTATE_TRIGGER_SIZE=50M`,
          `LOGROTATE_TRIGGER_SIZE=5`,
          `LOGROTATE_START_INDEX=1`,
          `CRON_SCHEDULE=* * * * *`,
          `CRON_LOG_LEVEL=8`,
          `TRAEFIK_CONTAINER_ID_COMMAND=docker ps --quiet --filter ancestor=traefik`,
        ],
        Labels: { "depker.name": DEPKER_LOGROTATE },
        HostConfig: {
          RestartPolicy: { Name: "always" },
          Binds: [`/var/run/docker.sock:/var/run/docker.sock`, `${LINUX_DIR(dir)}:/var/traefik`],
        },
      });

      // connect to depker network
      const network = await this.dockerService.depkerNetwork();
      await network.connect({ Container: container.id });

      // start container
      await container.start();

      this.logger.log(`Logrotate started.`);
    };

    await Promise.all([_traefik(), _logrotate()]);
  }

  async onModuleInit() {
    await this.reload(true);
  }
}
