import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DockerService } from "../services/docker.service";
import { BASE_DIR, LINUX_DIR } from "../constants/dir.constant";
import path from "path";
import fs from "fs-extra";
import YAML from "yaml";
import {
  DEPKER_CERT,
  DEPKER_SERVER,
  DEPKER_TRAEFIK,
} from "../constants/depker.constant";
import { SettingService } from "../services/setting.service";

@Injectable()
export class TraefikTask implements OnModuleInit {
  private readonly logger = new Logger(TraefikTask.name);

  constructor(
    private readonly settingService: SettingService,
    private readonly dockerService: DockerService
  ) {}

  async reload(force = false) {
    this.logger.log(`reload traefik...`);

    // load config
    const setting = await this.settingService.get();

    // pull traefik image
    const images = await this.dockerService.listImages();
    const imageName = setting.traefik.image ?? "traefik:latest";
    const image = images.find((image) => {
      return image.RepoTags && image.RepoTags.includes(imageName);
    });
    if (!image) {
      this.logger.log(`no traefik image found, pulling...`);
      await this.dockerService.pullImage(imageName);
    }

    // find exists traefik container
    const containers = await this.dockerService.listContainers({ all: true });
    const traefik = containers.find((c) =>
      c.Names.find((n) => n.startsWith(`/${DEPKER_TRAEFIK}`))
    );
    const server = containers.find((container) =>
      container.Names.find((n) => n.startsWith(`/${DEPKER_SERVER}`))
    );

    if (traefik) {
      if (force) {
        // if force reload, remove
        this.logger.log(`force reload, re-creating...`);
        const container = await this.dockerService.getContainer(traefik.Id);
        await container.remove({ force: true });
      } else if (traefik.Status.includes("Exited")) {
        // if traefik container is exited, remove
        this.logger.log(`exited traefik instance found, re-creating...`);
        const container = await this.dockerService.getContainer(traefik.Id);
        await container.remove({ force: true });
      } else {
        // if traefik container exists, restart
        this.logger.log(`traefik already running. Restarting traefik...`);
        const container = await this.dockerService.getContainer(traefik.Id);
        await container.restart();
        this.logger.log(`traefik restart done!`);
        return;
      }
    }

    // find traefik base dir
    let dir = path.posix.join(BASE_DIR, "traefik");
    if (server) {
      this.logger.log(`depker-server is running inside docker.`);
      const base = server.Mounts.find(
        (v) => v.Destination === LINUX_DIR(BASE_DIR)
      );
      if (base) {
        dir = path.posix.join(base.Source, "traefik");
      }
    } else {
      this.logger.log(`depker-server is running without docker.`);
    }
    this.logger.log(`traefik use dir: ${dir}`);

    // ensure dir
    fs.ensureDirSync(dir);
    fs.ensureDirSync(path.posix.join(dir, "conf.d"));

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
        dashboard: true,
      },
      entryPoints: {
        http: {
          address: ":80",
        },
        https: {
          address: ":443",
        },
        ...setting.traefik.ports?.reduce(
          (a, p) => ({
            ...a,
            [`port${p}`]: { address: `:${p}` },
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
            ...(!setting.traefik.tls || setting.traefik.tls === "http"
              ? {
                  httpChallenge: {
                    entryPoint: "http",
                  },
                }
              : {
                  dnsChallenge: {
                    provider: setting.traefik.tls,
                  },
                }),
          },
        },
      },
    };
    const dashboardYaml = {
      http: {
        routers: {
          traefik: {
            entryPoints: "https",
            rule: `Host(\`${setting.traefik.dashboard}\`)`,
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
    };
    fs.outputFileSync(
      path.posix.join(dir, "traefik.yml"),
      YAML.stringify(traefikYaml)
    );
    if (setting.traefik.dashboard) {
      fs.outputFileSync(
        path.posix.join(dir, "conf.d", "dashboard.yml"),
        YAML.stringify(dashboardYaml)
      );
    }

    // create traefik container
    const container = await this.dockerService.createContainer({
      name: DEPKER_TRAEFIK,
      Image: imageName,
      Cmd: ["--configFile=/var/traefik/traefik.yml"],
      Env: Object.entries(setting.traefik.envs ?? {}).map(
        ([k, v]) => `${k}=${v}`
      ),
      Labels: { ...setting.traefik.labels },
      ExposedPorts: {
        "80/tcp": {},
        "443/tcp": {},
        ...setting.traefik.ports?.reduce(
          (a, p) => ({
            ...a,
            [p]: {},
          }),
          {}
        ),
      },
      HostConfig: {
        RestartPolicy: { Name: "always" },
        Binds: [
          `/var/run/docker.sock:/var/run/docker.sock`,
          `${LINUX_DIR(dir)}:/var/traefik`,
        ],
        PortBindings: {
          "80/tcp": [{ HostPort: "80" }],
          "443/tcp": [{ HostPort: "443" }],
          ...setting.traefik.ports?.reduce(
            (a, p) => ({
              ...a,
              [p]: [{ HostPort: p.split("/")[0] }],
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

    this.logger.log(`traefik started!`);
  }

  async onModuleInit() {
    await this.reload(true);
  }
}
