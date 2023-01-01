import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DepkerPluginOption, LoadedDepkerPlugin } from "../plugins/plugin.types";
import fs from "fs-extra";
import path from "path";
import { IS_WIN, PATHS } from "../constants/depker.constant";
import { pathToFileURL } from "url";
import { PluginContext } from "../plugins/plugin.context";
import { ModuleRef } from "@nestjs/core";
import { spawnSync } from "child_process";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PluginEvent } from "../events/plugin.event";
import { Service } from "../entities/service.entity";
import { internal } from "../plugins/internal.plugin";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PluginService.name);

  private _loaded = false;
  private readonly _internal: Record<string, LoadedDepkerPlugin> = {};
  private readonly _external: Record<string, LoadedDepkerPlugin> = {};

  constructor(private readonly ref: ModuleRef, private readonly events: EventEmitter2) {}

  public async load(force = false): Promise<Record<string, LoadedDepkerPlugin>> {
    if (!this._loaded || force) {
      // internal
      for (const plugin of internal) {
        await this.events.emitAsync(PluginEvent.PRE_LOAD, plugin.name);
        this._internal[plugin.name] = plugin;
        await this.events.emitAsync(PluginEvent.POST_LOAD, plugin.name, plugin);
      }

      // external
      const pjson = fs.readJsonSync(path.join(PATHS.PLUGINS, "package.json"));
      const pkgs = Object.keys(pjson.dependencies || {});
      for (const pkg of pkgs) {
        const dir = path.join(PATHS.PLUGINS, "node_modules", pkg);
        const idx = path.join(dir, "index.js");
        await this.events.emitAsync(PluginEvent.PRE_LOAD, pkg);
        const mod = await import(pathToFileURL(idx).toString());
        if (mod.name) {
          this._external[mod.name] = { pkg, dir, ...mod };
        }
        await this.events.emitAsync(PluginEvent.POST_LOAD, pkg, mod);
      }
      this._loaded = true;
    }
    return { ...this._internal, ...this._external };
  }

  public async plugins(): Promise<Record<string, LoadedDepkerPlugin>> {
    return await this.load();
  }

  public async buildpacks(): Promise<Record<string, LoadedDepkerPlugin>> {
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

  public async validate(options: DepkerPluginOption[], values: Record<string, any>) {
    for (const option of options ?? []) {
      const value = values[option.name];
      if (option.required && (value === null || value === undefined)) {
        return `Plugin option ${option.label ?? option.name} is required.`;
      }
      if (option.type === "number" && value !== null && value !== undefined) {
        if (option.min !== undefined && option.min !== null && option.min > value) {
          return `Plugin option ${option.label ?? option.name} must be less than or equal to ${option.min}.`;
        }
        if (option.max !== undefined && option.max !== null && option.max < value) {
          return `Plugin option ${option.label ?? option.name} must be more than or equal to ${option.max}.`;
        }
      }
      if (option.type === "select" && option.multiple && value !== null && value !== undefined) {
        if (option.min !== undefined && option.min !== null && option.min > value.length) {
          return `Plugin option ${option.label ?? option.name} length must be less than or equal to ${option.min}.`;
        }
        if (option.max !== undefined && option.max !== null && option.max < value.length) {
          return `Plugin option ${option.label ?? option.name} length must be less than or equal to ${option.max}.`;
        }
      }
      if (option.validate && value !== null && value !== undefined) {
        const valid = option.validate(value as never);
        if (valid) {
          return `Plugin option ${option.label ?? option.name} is not validated. ${valid}`;
        }
      }
    }
  }

  public async onModuleInit() {
    const plugins = await this.load();
    await this.events.emitAsync(PluginEvent.PRE_INIT);
    for (const plugin of Object.values(plugins)) {
      await plugin?.init?.(
        new PluginContext({
          plugin,
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
          plugin,
          ref: this.ref,
        })
      );
    }
    await this.events.emitAsync(PluginEvent.POST_DESTROY);
  }
}
