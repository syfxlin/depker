import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DepkerPlugin } from "../plugins/plugin.types";
import fs from "fs-extra";
import path from "path";
import { IS_WIN, PATHS } from "../constants/depker.constant";
import { pathToFileURL } from "url";
import { PluginContext } from "../plugins/plugin.context";
import * as example from "../plugins/example";
import * as dockerfile from "../plugins/dockerfile";
import { image } from "../plugins/image";
import { ModuleRef } from "@nestjs/core";
import { spawnSync } from "child_process";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PluginEvent } from "../events/plugin.event";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PluginService.name);

  private _loaded = false;
  private readonly _internal: DepkerPlugin[] = [image, example as DepkerPlugin, dockerfile as DepkerPlugin];
  private readonly _plugins: Record<string, DepkerPlugin> = {};

  constructor(private readonly ref: ModuleRef, private readonly events: EventEmitter2) {}

  public async load(): Promise<Record<string, DepkerPlugin>> {
    if (!this._loaded) {
      const plugins: DepkerPlugin[] = [...this._internal];
      const pjson = fs.readJsonSync(path.join(PATHS.PLUGINS, "package.json"));
      const names = Object.keys(pjson.dependencies || {});
      for (const name of names) {
        const idx = path.join(PATHS.PLUGINS, "node_modules", name, "index.js");
        await this.events.emitAsync(PluginEvent.PRE_LOAD, name);
        const mod = await import(pathToFileURL(idx).toString());
        if (mod.name) {
          plugins.push(mod);
        }
        await this.events.emitAsync(PluginEvent.POST_LOAD, name, mod);
      }
      for (const plugin of plugins) {
        this._plugins[plugin.name] = plugin;
      }
      this._loaded = true;
    }
    return this._plugins;
  }

  public async plugins(): Promise<Record<string, DepkerPlugin>> {
    return await this.load();
  }

  public async buildpacks(): Promise<Record<string, DepkerPlugin>> {
    const plugins = await this.load();
    return Object.entries(plugins)
      .filter(([, p]) => p.buildpack?.handler)
      .reduce((a, [n, p]) => ({ ...a, [n]: p }), {});
  }

  public async install(pkg: string) {
    await this.events.emitAsync(PluginEvent.PRE_INSTALL, pkg);
    const returns = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["install", pkg], { cwd: PATHS.PLUGINS });
    await this.events.emitAsync(PluginEvent.POST_INSTALL, pkg, returns);
    this.logger.debug(
      `Install plugin ${pkg}, status: ${returns.status}, stdout: ${returns.stdout}, stderr: ${returns.stderr}`
    );
    return returns.status === 0;
  }

  public async uninstall(pkg: string) {
    await this.events.emitAsync(PluginEvent.PRE_UNINSTALL, pkg);
    const returns = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["uninstall", pkg], { cwd: PATHS.PLUGINS });
    await this.events.emitAsync(PluginEvent.POST_UNINSTALL, pkg, returns);
    this.logger.debug(
      `Uninstall plugin ${pkg}, status: ${returns.status}, stdout: ${returns.stdout}, stderr: ${returns.stderr}`
    );
    return returns.status === 0;
  }

  public async onModuleInit() {
    const plugins = await this.load();
    await this.events.emitAsync(PluginEvent.PRE_INIT);
    for (const plugin of Object.values(plugins)) {
      await plugin?.init?.(
        new PluginContext({
          name: plugin.name,
          ref: this.ref,
        })
      );
    }
    await this.events.emitAsync(PluginEvent.POST_INIT);
  }

  public async onModuleDestroy() {
    const plugins = await this.load();
    await this.events.emitAsync(PluginEvent.PRE_DESTROY);
    for (const plugin of Object.values(plugins)) {
      await plugin?.destroy?.(
        new PluginContext({
          name: plugin.name,
          ref: this.ref,
        })
      );
    }
    await this.events.emitAsync(PluginEvent.POST_DESTROY);
  }
}
