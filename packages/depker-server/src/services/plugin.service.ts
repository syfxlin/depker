import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DepkerPlugin, LoadedDepkerPlugin } from "../plugins/plugin.types";
import fs from "fs-extra";
import path from "path";
import { IS_WIN, PATHS } from "../constants/depker.constant";
import { pathToFileURL } from "url";
import { PluginContext } from "../plugins/plugin.context";
import * as example from "../plugins/example";
import * as dockerfile from "../plugins/dockerfile";
import { ModuleRef } from "@nestjs/core";
import { spawnSync } from "child_process";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PluginEvent } from "../events/plugin.event";
import { Service } from "../entities/service.entity";
import { image } from "../plugins/buildpacks/image/image.plugin";
import { nginx } from "../plugins/buildpacks/nginx/nginx.plugin";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PluginService.name);

  private _loaded = false;
  private readonly _defined: DepkerPlugin[] = [image, nginx, example as DepkerPlugin, dockerfile as DepkerPlugin];
  private readonly _internal: Record<string, LoadedDepkerPlugin> = {};
  private readonly _external: Record<string, LoadedDepkerPlugin> = {};

  constructor(private readonly ref: ModuleRef, private readonly events: EventEmitter2) {}

  public async load(force = false): Promise<Record<string, LoadedDepkerPlugin>> {
    if (!this._loaded || force) {
      // internal
      for (const plugin of this._defined) {
        await this.events.emitAsync(PluginEvent.PRE_LOAD, plugin.name);
        this._internal[plugin.name] = { pkg: plugin.name, ...plugin };
        await this.events.emitAsync(PluginEvent.POST_LOAD, plugin.name, plugin);
      }

      // external
      const pjson = fs.readJsonSync(path.join(PATHS.PLUGINS, "package.json"));
      const pkgs = Object.keys(pjson.dependencies || {});
      for (const pkg of pkgs) {
        const idx = path.join(PATHS.PLUGINS, "node_modules", pkg, "index.js");
        await this.events.emitAsync(PluginEvent.PRE_LOAD, pkg);
        const mod = await import(pathToFileURL(idx).toString());
        if (mod.name) {
          this._external[mod.name] = { pkg, ...mod };
        }
        await this.events.emitAsync(PluginEvent.POST_LOAD, pkg, mod);
      }
      this._loaded = true;
    }
    return { ...this._internal, ...this._external };
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

  public async install(name: string) {
    await this.load();
    const plugin = this._internal[name];
    if (plugin) {
      return `This plugin is already defined internally and cannot be overridden.`;
    }
    await this.events.emitAsync(PluginEvent.PRE_INSTALL, name);
    const returns = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["install", name], { cwd: PATHS.PLUGINS });
    await this.events.emitAsync(PluginEvent.POST_INSTALL, name, returns);
    this.logger.debug(
      `Install plugin ${name}, status: ${returns.status}, stdout: ${returns.stdout}, stderr: ${returns.stderr}`
    );
    if (returns.status !== 0) {
      return `Exit code is ${returns.status}`;
    }
    await this.load(true);
    return null;
  }

  public async uninstall(name: string) {
    await this.load();
    const plugin = this._external[name];
    if (!plugin) {
      return `This plugin is not installed or is an internal package.`;
    }

    const used = await Service.countBy({ buildpack: plugin.name });
    if (used) {
      return `This plugin is currently in use and cannot be uninstalled.`;
    }

    await this.events.emitAsync(PluginEvent.PRE_UNINSTALL, plugin.pkg);
    const returns = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["uninstall", plugin.pkg], { cwd: PATHS.PLUGINS });
    await this.events.emitAsync(PluginEvent.POST_UNINSTALL, plugin.pkg, returns);
    this.logger.debug(
      `Uninstall plugin ${plugin.pkg}, status: ${returns.status}, stdout: ${returns.stdout}, stderr: ${returns.stderr}`
    );
    if (returns.status !== 0) {
      return `Exit code is ${returns.status}`;
    }
    await this.load(true);
    return null;
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
