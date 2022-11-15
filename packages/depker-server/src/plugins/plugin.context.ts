import { NAMES, PATHS } from "../constants/depker.constant";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App } from "../entities/app.entity";
import { Deploy } from "../entities/deploy.entity";
import { Log } from "../entities/log.entity";
import { DockerService } from "../services/docker.service";
import { HttpService } from "nestjs-http-promise";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import { StorageService } from "../services/storage.service";
import { PluginService } from "../services/plugin.service";
import { AuthService } from "../guards/auth.service";
import { Logger } from "@nestjs/common";

export interface PluginOptions {
  readonly name: string;
  readonly docker: DockerService;
  readonly https: HttpService;
  readonly events: EventEmitter2;
  readonly schedules: SchedulerRegistry;
  readonly storages: StorageService;
  readonly plugins: PluginService;
  readonly auths: AuthService;
}

export class PluginContext {
  // constants
  public static readonly NAMES: Readonly<typeof NAMES> = NAMES;
  public static readonly PATHS: Readonly<typeof PATHS> = PATHS;

  // entity
  public readonly App = App;
  public readonly Deploy = Deploy;
  public readonly Log = Log;
  public readonly Setting = Setting;
  public readonly Token = Token;

  // logger
  public readonly logger: Logger;

  // values
  public readonly name: string;

  // services
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
    this.docker = options.docker;
    this.https = options.https;
    this.events = options.events;
    this.schedules = options.schedules;
    this.storages = options.storages;
    this.plugins = options.plugins;
    this.auths = options.auths;
  }

  public async options(name?: string, value?: any) {
    const setting = await Setting.read();
    const options = setting.plugins[this.name] ?? {};
    if (!name) {
      return options;
    } else if (value === undefined) {
      return options[name];
    } else if (value === null) {
      delete options[name];
    } else {
      options[name] = value;
    }
    setting.plugins[this.name] = options;
    await Setting.write(setting);
  }
}
