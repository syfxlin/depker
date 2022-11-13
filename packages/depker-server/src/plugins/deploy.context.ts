import { INestApplication, Logger } from "@nestjs/common";
import { IMAGES, NAMES, PATHS } from "../constants/depker.constant";
import { HttpService } from "nestjs-http-promise";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DockerService } from "../services/docker.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App, AppHealthCheck, AppMiddleware, AppRestart } from "../entities/app.entity";
import { Deploy } from "../entities/deploy.entity";
import { DeployLogger, Log } from "../entities/log.entity";
import { Volume } from "../entities/volume.entity";
import { Port } from "../entities/port.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PortBind } from "../entities/port-bind.entity";
import fs from "fs-extra";
import { PassThrough } from "stream";
import { createInterface } from "readline";
import { StorageService } from "../services/storage.service";
import { PluginService } from "../services/plugin.service";
import { AuthService } from "../guards/auth.service";
import { ContainerCreateOptions } from "dockerode";

export interface PluginOptions {
  readonly name: string;
  readonly context: INestApplication;
}

export interface DeployOptions extends PluginOptions {
  project: string;
  deploy: Deploy;
}

export interface DeployBuildAppOptions {
  project: string;
  // options
  file?: string;
  pull?: boolean;
  cache?: boolean;
  // values
  args?: Record<string, string>;
  hosts?: Record<string, string>;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
}

export interface DeployBuildAsOptions extends DeployBuildAppOptions {
  name: string;
}

export interface DeployStartAtOptions {
  name: string;
  image: string;
  // options
  restart?: AppRestart;
  pull?: boolean;
  // values
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  networks?: Record<string, string>;
  hosts?: Record<string, string>;
  // extensions
  commands?: string[];
  entrypoints?: string[];
  healthcheck?: AppHealthCheck;
  init?: boolean;
  rm?: boolean;
  privileged?: boolean;
  user?: string;
  workdir?: string;
  // web
  domain?: string[];
  rule?: string;
  port?: number;
  scheme?: string;
  tls?: boolean;
  middlewares?: AppMiddleware[];
  // relations
}

export class PluginContext {
  // constants
  public static readonly NAMES: Readonly<typeof NAMES> = NAMES;
  public static readonly PATHS: Readonly<typeof PATHS> = PATHS;

  // entity
  public readonly App = App;
  public readonly Deploy = Deploy;
  public readonly Log = Log;
  public readonly Port = Port;
  public readonly PortBind = PortBind;
  public readonly Setting = Setting;
  public readonly Token = Token;
  public readonly Volume = Volume;
  public readonly VolumeBind = VolumeBind;

  // logger
  public readonly logger: Logger;

  // values
  public readonly name: string;

  // services
  public readonly app: INestApplication;
  public readonly docker: DockerService;
  public readonly https: HttpService;
  public readonly events: EventEmitter2;
  public readonly schedules: SchedulerRegistry;
  public readonly storages: StorageService;
  public readonly plugins: PluginService;
  public readonly auths: AuthService;

  constructor(options: PluginOptions) {
    this.logger = new Logger(`Plugin-${options.name}`);
    this.name = options.name;
    this.app = options.context;
    this.docker = this.app.get(DockerService);
    this.https = this.app.get(HttpService);
    this.events = this.app.get(EventEmitter2);
    this.schedules = this.app.get(SchedulerRegistry);
    this.storages = this.app.get(StorageService);
    this.plugins = this.app.get(PluginService);
    this.auths = this.app.get(AuthService);
  }
}

export class DeployContext extends PluginContext {
  // logger
  public readonly log: DeployLogger;

  // values
  public readonly project: string;
  public readonly deploy: Deploy;

  constructor(options: DeployOptions) {
    super(options);
    this.deploy = options.deploy;
    this.project = options.project;
    this.log = this.Log.logger(options.deploy);
  }

  public async buildApp(options: DeployBuildAppOptions) {
    return await this.buildAs({
      name: this.deploy.app.name,
      project: options.project,
      file: options.file,
      pull: options.pull ?? this.deploy.app.pull,
      cache: options.cache ?? this.deploy.app.pull,
      args: {
        ...options.args,
        ...this.deploy.app.buildArgs,
      },
      hosts: {
        ...options.hosts,
        ...this.deploy.app.hosts.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
      },
      labels: {
        ...options.labels,
        ...this.deploy.app.labels.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
      },
      secrets: {
        ...options.secrets,
        ...this.deploy.app.secrets.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
      },
    });
  }

  public async buildAs(options: DeployBuildAsOptions) {
    // values
    const name = options.name;
    const tag = `depker-${name}`;
    const project = options.project;
    const secrets = await this.storages.file(name);

    // logger
    await this.log.step(`Building image ${tag} started.`);

    // commands
    const commands: string[] = [`DOCKER_BUILDKIT=1`, `docker`, `build`, `--progress=plain`, `--tag=${tag}`];
    if (options.file) {
      commands.push(`--file=${options.file}`);
    }
    if (typeof options.pull !== "boolean" || options.pull) {
      commands.push(`--pull`);
    }
    if (typeof options.cache !== "boolean" || options.cache) {
      commands.push(`--no-cache`);
    }
    for (const [name, value] of Object.entries(options.args ?? {})) {
      commands.push(`--build-arg=${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options.hosts ?? {})) {
      commands.push(`--add-host=${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options.labels ?? {})) {
      commands.push(`--label=${name}=${value}`);
    }
    // prettier-ignore
    fs.outputFileSync(secrets, Object.entries(options.secrets ?? {}).map(([name, value]) => `${name}=${value}\n`).join(""));

    // output
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => {
      this.log.log(line);
    });

    // build image
    await this.docker.pullImage(IMAGES.DOCKER);
    const [result] = await this.docker.run(IMAGES.DOCKER, [`sh`, `-c`, commands.join(" ")], through, {
      WorkingDir: "/project",
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${PATHS.LINUX(project)}:/project`,
          `${PATHS.LINUX(secrets)}:/secrets`,
          `/var/run/docker.sock:/var/run/docker.sock`,
        ],
      },
    });
    if (result.StatusCode === 0) {
      await this.log.success(`Building image ${tag} successful.`);
      return tag;
    } else {
      await this.log.error(`Building image ${tag} failure.`);
      return null;
    }
  }

  public async startAt(options: DeployStartAtOptions) {
    // values
    const name = options.name;
    const image = options.image;

    // logger
    await this.log.step(`Start container ${name} started.`);

    // args
    const envs: Record<string, string> = {
      ...options.secrets,
      DEPKER_NAME: name,
    };
    const labels: Record<string, string> = {
      ...options.labels,
      "depker.name": name,
      "traefik.enable": "true",
      "traefik.docker.network": NAMES.NETWORK,
    };
    const args: ContainerCreateOptions = {
      name: `${name}-${Date.now()}`,
      Image: image,
      HostConfig: {},
    };
  }
}
