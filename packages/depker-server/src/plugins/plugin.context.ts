import { NAMES, PATHS } from "../constants/depker.constant";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { Service } from "../entities/service.entity";
import { Deploy } from "../entities/deploy.entity";
import { DeployLog } from "../entities/deploy-log.entity";
import { DockerService } from "../services/docker.service";
import { HttpService } from "nestjs-http-promise";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import { StorageService } from "../services/storage.service";
import { PluginService } from "../services/plugin.service";
import { AuthService } from "../guards/auth.service";
import { Logger } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DeployService } from "../services/deploy.service";
import { LoadedDepkerPlugin } from "./plugin.types";

export interface PluginOptions {
  readonly plugin: LoadedDepkerPlugin;
  readonly ref: ModuleRef;
}

export class PluginContext {
  // constants
  public static readonly NAMES: Readonly<typeof NAMES> = NAMES;
  public static readonly PATHS: Readonly<typeof PATHS> = PATHS;

  // entity
  public readonly Service = Service;
  public readonly Deploy = Deploy;
  public readonly Log = DeployLog;
  public readonly Setting = Setting;
  public readonly Token = Token;

  // logger
  public readonly logger: Logger;

  // values
  public readonly name: string;
  public readonly plugin: LoadedDepkerPlugin;
  public readonly ref: ModuleRef;

  // services
  public readonly docker: DockerService;
  public readonly https: HttpService;
  public readonly events: EventEmitter2;
  public readonly schedules: SchedulerRegistry;
  public readonly storages: StorageService;
  public readonly plugins: PluginService;
  public readonly auths: AuthService;
  public readonly deploys: DeployService;

  constructor(options: PluginOptions) {
    this.logger = new Logger(`Plugin-${options.plugin.name}`);
    this.name = options.plugin.name;
    this.plugin = options.plugin;
    this.ref = options.ref;
    this.docker = this.ref.get(DeployService, { strict: false });
    this.https = this.ref.get(HttpService, { strict: false });
    this.events = this.ref.get(EventEmitter2, { strict: false });
    this.schedules = this.ref.get(SchedulerRegistry, { strict: false });
    this.storages = this.ref.get(StorageService, { strict: false });
    this.plugins = this.ref.get(PluginService, { strict: false });
    this.auths = this.ref.get(AuthService, { strict: false });
    this.deploys = this.ref.get(DeployService, { strict: false });
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
