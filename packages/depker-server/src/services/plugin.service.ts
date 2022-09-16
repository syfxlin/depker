import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DepkerPlugin } from "../plugins/plugin.types";
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";
import { pathToFileURL } from "url";
import { PluginContext } from "../plugins/plugin.context";
import { HttpService } from "nestjs-http-promise";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DockerService } from "./docker.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import * as example from "../plugins/example";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App } from "../entities/app.entity";
import { Log } from "../entities/log.entity";
import { Volume } from "../entities/volume.entity";
import { Port } from "../entities/port.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PortBind } from "../entities/port-bind.entity";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private _loaded = false;
  private readonly plugins: DepkerPlugin[] = [example as DepkerPlugin];

  constructor(
    private readonly http: HttpService,
    private readonly events: EventEmitter2,
    private readonly docker: DockerService,
    private readonly schedule: SchedulerRegistry
  ) {}

  public async load() {
    if (!this._loaded) {
      const plugins: DepkerPlugin[] = [];
      const pjson = fs.readJsonSync(path.join(PATHS.PLUGINS, "package.json"));
      const names = Object.keys(pjson.dependencies || {});
      for (const name of names) {
        const idx = path.join(PATHS.PLUGINS, "node_modules", name, "index.js");
        const mod = await import(pathToFileURL(idx).toString());
        if (mod.name) {
          plugins.push(mod);
        }
      }
      this.plugins.push(...plugins);
      this._loaded = true;
    }
    return this.plugins as DepkerPlugin[];
  }

  public async buildpacks() {
    const plugins = await this.load();
    return plugins.filter((p) => p.buildpack);
  }

  public async routes() {
    const plugins = await this.load();
    return plugins.filter((p) => p.routes);
  }

  public async onModuleInit() {
    const plugins = await this.load();
    for (const plugin of plugins) {
      await plugin?.init?.(
        new PluginContext({
          name: plugin.name,
          http: this.http,
          events: this.events,
          docker: this.docker,
          schedule: this.schedule,
          entities: {
            Setting: Setting,
            Token: Token,
            App: App,
            Log: Log,
            Volume: Volume,
            Port: Port,
            VolumeBind: VolumeBind,
            PortBind: PortBind,
          },
        })
      );
    }
  }

  public async onModuleDestroy() {
    const plugins = await this.load();
    for (const plugin of plugins) {
      await plugin?.destroy?.(
        new PluginContext({
          name: plugin.name,
          http: this.http,
          events: this.events,
          docker: this.docker,
          schedule: this.schedule,
          entities: {
            Setting: Setting,
            Token: Token,
            App: App,
            Log: Log,
            Volume: Volume,
            Port: Port,
            VolumeBind: VolumeBind,
            PortBind: PortBind,
          },
        })
      );
    }
  }
}
