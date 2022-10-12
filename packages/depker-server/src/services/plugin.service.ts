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
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { App } from "../entities/app.entity";
import { Log } from "../entities/log.entity";
import { Volume } from "../entities/volume.entity";
import { Port } from "../entities/port.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PortBind } from "../entities/port-bind.entity";
import * as example from "../plugins/example";
import * as dockerfile from "../plugins/dockerfile";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private _loaded = false;
  private readonly _internal: DepkerPlugin[] = [example as DepkerPlugin, dockerfile as DepkerPlugin];
  private readonly _plugins: Map<string, DepkerPlugin> = new Map<string, DepkerPlugin>();

  constructor(
    private readonly http: HttpService,
    private readonly events: EventEmitter2,
    private readonly docker: DockerService,
    private readonly schedule: SchedulerRegistry
  ) {}

  public async load() {
    if (!this._loaded) {
      const plugins: DepkerPlugin[] = [...this._internal];
      const pjson = fs.readJsonSync(path.join(PATHS.PLUGINS, "package.json"));
      const names = Object.keys(pjson.dependencies || {});
      for (const name of names) {
        const idx = path.join(PATHS.PLUGINS, "node_modules", name, "index.js");
        const mod = await import(pathToFileURL(idx).toString());
        if (mod.name) {
          plugins.push(mod);
        }
      }
      for (const plugin of plugins) {
        this._plugins.set(plugin.name, plugin);
      }
      this._loaded = true;
    }
    return this._plugins;
  }

  public async plugins() {
    return await this.load();
  }

  public async plugin(name: string) {
    const plugins = await this.load();
    return plugins.get(name);
  }

  public async onModuleInit() {
    const plugins = await this.load();
    for (const plugin of plugins.values()) {
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
    for (const plugin of plugins.values()) {
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
