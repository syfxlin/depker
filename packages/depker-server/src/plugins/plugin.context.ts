import { NAMES, PATHS } from "../constants/depker.constant";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DockerService } from "../services/docker.service";
import { HttpService } from "nestjs-http-promise";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Logger } from "@nestjs/common";
import fs from "fs-extra";
import path from "path";
import { Request, Response } from "express";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App } from "../entities/app.entity";
import { Deploy } from "../entities/deploy.entity";
import { DeployLogger, Log } from "../entities/log.entity";
import { Volume } from "../entities/volume.entity";
import { Port } from "../entities/port.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PortBind } from "../entities/port-bind.entity";
import { StorageService } from "../services/storage.service";
import { PluginService } from "../services/plugin.service";
import { AuthService } from "../guards/auth.service";

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

export interface PackOptions extends PluginOptions {
  project: string;
  deploy: Deploy;
}

export interface RouteOptions extends PluginOptions {
  request: Request;
  response: Response;
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
  public readonly docker: DockerService;
  public readonly https: HttpService;
  public readonly events: EventEmitter2;
  public readonly schedules: SchedulerRegistry;
  public readonly storages: StorageService;
  public readonly plugins: PluginService;
  public readonly auths: AuthService;

  constructor(options: PluginOptions) {
    this.logger = new Logger(`Plugin-${options.name}`);
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

export class PackContext extends PluginContext {
  // logger
  public readonly log: DeployLogger;

  // values
  public readonly project: string;
  public readonly deploy: Deploy;

  constructor(options: PackOptions) {
    super(options);
    this.deploy = options.deploy;
    this.project = options.project;
    this.log = this.Log.logger(options.deploy);
  }

  public dockerfile(data: string) {
    fs.outputFileSync(path.join(this.project, "Dockerfile"), data, "utf-8");
  }

  public exists(file: string) {
    return fs.pathExistsSync(path.join(this.project, file));
  }

  public read(file: string) {
    return fs.readFileSync(path.join(this.project, file), { encoding: "utf-8" });
  }

  public write(file: string, data: string) {
    fs.outputFileSync(path.join(this.project, file), data, "utf-8");
  }

  public async values(name?: string, value?: any) {
    const values = this.deploy.app.extensions ?? {};
    if (!name) {
      return values;
    } else if (value === undefined) {
      return values[name];
    } else if (value === null) {
      delete values[name];
    } else {
      values[name] = value;
    }
    this.deploy.app.extensions = values;
    await App.save(this.deploy.app);
  }
}

export class RouteContext extends PluginContext {
  public readonly method: string;
  public readonly path: string;
  public readonly request: Request;
  public readonly response: Response;

  constructor(options: RouteOptions) {
    super(options);
    this.method = options.request.method;
    this.path = options.request.param("path");
    this.request = options.request;
    this.response = options.response;
  }
}
