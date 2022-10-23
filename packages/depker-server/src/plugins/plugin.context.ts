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

export interface PluginOptions {
  readonly name: string;
  readonly http: HttpService;
  readonly events: EventEmitter2;
  readonly docker: DockerService;
  readonly schedule: SchedulerRegistry;
  readonly entities: {
    readonly Setting: typeof Setting;
    readonly Token: typeof Token;
    readonly App: typeof App;
    readonly Log: typeof Log;
    readonly Volume: typeof Volume;
    readonly Port: typeof Port;
    readonly VolumeBind: typeof VolumeBind;
    readonly PortBind: typeof PortBind;
  };
}

export interface PackOptions extends PluginOptions {
  deploy: Deploy;
  project: string;
}

export interface RouteOptions extends PluginOptions {
  request: Request;
  response: Response;
}

export class PluginContext {
  // logger
  public readonly logger: Logger;

  // values
  public readonly name: string;
  public readonly names: Readonly<typeof NAMES> = NAMES;
  public readonly paths: Readonly<typeof PATHS> = PATHS;

  // services
  public readonly http: PluginOptions["http"];
  public readonly events: PluginOptions["events"];
  public readonly docker: PluginOptions["docker"];
  public readonly schedule: PluginOptions["schedule"];
  public readonly entities: PluginOptions["entities"];

  constructor(options: PluginOptions) {
    this.logger = new Logger(`Plugin-${options.name}`);
    this.name = options.name;
    this.http = options.http;
    this.events = options.events;
    this.docker = options.docker;
    this.schedule = options.schedule;
    this.entities = options.entities;
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
  public readonly deploy: Deploy;
  public readonly project: string;
  public readonly log: DeployLogger;

  constructor(options: PackOptions) {
    super(options);
    this.deploy = options.deploy;
    this.project = options.project;
    this.log = options.entities.Log.logger(options.deploy);
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
