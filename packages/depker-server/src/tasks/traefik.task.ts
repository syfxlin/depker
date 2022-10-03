import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DockerService } from "../services/docker.service";
import path from "path";
import fs from "fs-extra";
import YAML from "yaml";
import { IMAGES, IS_DEV, NAMES, PATHS } from "../constants/depker.constant";
import { Setting } from "../entities/setting.entity";

@Injectable()
export class TraefikTask implements OnModuleInit {
  private readonly logger = new Logger(TraefikTask.name);

  constructor(private readonly docker: DockerService) {}

  public async reload(force = false) {
    this.logger.log(`Reloading traefik and logrotate.`);

    // load config
    const setting = await Setting.read();

    // find exists container
    const containers = await this.docker.listContainers({ all: true });

    // find traefik base dir
    const dir = PATHS.CONFIG;
    this.logger.log(`Traefik use dir: ${dir}`);

    // ensure dir
    fs.ensureDirSync(dir);
    fs.ensureDirSync(path.posix.join(dir, "conf.d"));

    const _traefik = async () => {
      await this.docker.pullImage(IMAGES.TRAEFIK, setting.upgrade);
      const traefik = containers.find((c) => c.Names.find((n) => n.startsWith(`/${NAMES.TRAEFIK}`)));

      if (traefik) {
        if (force) {
          // if force reload, remove
          this.logger.log(`Recreating traefik with force reload.`);
          const container = await this.docker.getContainer(traefik.Id);
          await container.remove({ force: true });
        } else if (traefik.Status.includes("Exited")) {
          // if traefik container is exited, remove
          this.logger.log(`Recreating traefik with exited.`);
          const container = await this.docker.getContainer(traefik.Id);
          await container.remove({ force: true });
        } else {
          // if traefik container exists, restart
          this.logger.log(`Restarting traefik with running.`);
          const container = await this.docker.getContainer(traefik.Id);
          await container.restart();
          this.logger.log(`Traefik restart done.`);
          return;
        }
      }

      // values
      // prettier-ignore
      const ports = Array(setting.ports[1] - setting.ports[0] + 1).fill(setting.ports[0]).map((x, y) => x + y);
      const envs: Record<string, string> = {
        ...setting.tls.env,
        DEPKER_NAME: NAMES.TRAEFIK,
      };
      const labels: Record<string, string> = {
        "depker.name": NAMES.TRAEFIK,
        "traefik.enable": "true",
        "traefik.docker.network": NAMES.NETWORK,
      };

      // write config
      const traefikYaml = {
        log: {
          level: "INFO",
          filePath: "/var/traefik/traefik.log",
        },
        accessLog: {
          filePath: "/var/traefik/traefik-access.log",
          bufferingSize: 100,
        },
        api: {
          insecure: true,
          dashboard: true,
        },
        metrics: {
          prometheus: {},
        },
        ping: {},
        entryPoints: {
          http: {
            address: ":80",
          },
          https: {
            address: ":443",
          },
          ...ports.reduce(
            (a, p) => ({
              ...a,
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
          [NAMES.CERTIFICATE]: {
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
      };
      fs.outputFileSync(path.posix.join(dir, "traefik.yml"), YAML.stringify(traefikYaml));
      fs.ensureDirSync(path.posix.join(dir, "conf.d"));

      // dashboard
      if (setting.dashboard) {
        labels[`traefik.http.routers.traefik.entrypoints`] = "https";
        labels[`traefik.http.routers.traefik.rule`] = `Host(\`${setting.dashboard}\`)`;
        labels[`traefik.http.routers.traefik.service`] = "api@internal";
        labels[`traefik.http.routers.traefik.middlewares`] = "traefik-auth";
        labels[`traefik.http.routers.traefik.tls.certresolver`] = NAMES.CERTIFICATE;
        labels[`traefik.http.middlewares.traefik-auth.basicauth.users`] = `${setting.username}:${setting.password}`;
      }

      // create traefik container
      const container = await this.docker.createContainer({
        name: NAMES.TRAEFIK,
        Image: IMAGES.TRAEFIK,
        Cmd: ["--configFile=/var/traefik/traefik.yml"],
        Env: Object.entries(envs).map(([k, v]) => `${k}=${v}`),
        Labels: labels,
        ExposedPorts: {
          "80/tcp": {},
          "443/tcp": {},
          "443/udp": {},
          ...(IS_DEV ? { "8080/tcp": {} } : {}),
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
          Binds: [`/var/run/docker.sock:/var/run/docker.sock`, `${PATHS.LINUX(dir)}:/var/traefik`],
          PortBindings: {
            "80/tcp": [{ HostPort: "80" }],
            "443/tcp": [{ HostPort: "443" }],
            "443/udp": [{ HostPort: "443" }],
            ...(IS_DEV ? { "8080/tcp": [{ HostPort: "8080" }] } : {}),
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
      const network = await this.docker.depkerNetwork();
      await network.connect({ Container: container.id });

      // start container
      await container.start();

      this.logger.log(`Traefik started.`);
    };

    const _logrotate = async () => {
      await this.docker.pullImage(IMAGES.LOGROTATE, setting.upgrade);
      const logrotate = containers.find((c) => c.Names.find((n) => n.startsWith(`/${NAMES.LOGROTATE}`)));

      if (logrotate) {
        if (force) {
          // if force reload, remove
          this.logger.log(`Recreating logrotate with force reload.`);
          const container = await this.docker.getContainer(logrotate.Id);
          await container.remove({ force: true });
        } else if (logrotate.Status.includes("Exited")) {
          // if logrotate container is exited, remove
          this.logger.log(`Recreating logrotate with exited.`);
          const container = await this.docker.getContainer(logrotate.Id);
          await container.remove({ force: true });
        } else {
          // if logrotate container exists, restart
          this.logger.log(`Restarting logrotate with running.`);
          const container = await this.docker.getContainer(logrotate.Id);
          await container.restart();
          this.logger.log(`Logrotate restart done.`);
          return;
        }
      }

      // create logrotate container
      const container = await this.docker.createContainer({
        name: NAMES.LOGROTATE,
        Image: IMAGES.LOGROTATE,
        Env: [
          `DEPKER_NAME=${NAMES.LOGROTATE}`,
          `LOGROTATE_LOGS=/var/traefik/*.log`,
          `LOGROTATE_TRIGGER_INTERVAL=weekly`,
          `LOGROTATE_TRIGGER_SIZE=50M`,
          `LOGROTATE_TRIGGER_SIZE=5`,
          `LOGROTATE_START_INDEX=1`,
          `CRON_SCHEDULE=* * * * *`,
          `CRON_LOG_LEVEL=8`,
          `TRAEFIK_CONTAINER_ID_COMMAND=docker ps --quiet --filter ancestor=traefik`,
        ],
        Labels: { "depker.name": NAMES.LOGROTATE },
        HostConfig: {
          RestartPolicy: { Name: "always" },
          Binds: [`/var/run/docker.sock:/var/run/docker.sock`, `${PATHS.LINUX(dir)}:/var/traefik`],
        },
      });

      // connect to depker network
      const network = await this.docker.depkerNetwork();
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
