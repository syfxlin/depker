import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DepkerPlugin } from "../plugins/plugin.types";
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";
import { pathToFileURL } from "url";
import { PluginContext } from "../plugins/plugin.context";
import * as example from "../plugins/example";
import * as dockerfile from "../plugins/dockerfile";
import { image } from "../plugins/image";
import { ModuleRef } from "@nestjs/core";

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
  private _loaded = false;
  private readonly _internal: DepkerPlugin[] = [image, example as DepkerPlugin, dockerfile as DepkerPlugin];
  private readonly _plugins: Record<string, DepkerPlugin> = {};

  constructor(private readonly ref: ModuleRef) {}

  public async load(): Promise<Record<string, DepkerPlugin>> {
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

  public async onModuleInit() {
    const plugins = await this.load();
    for (const plugin of Object.values(plugins)) {
      await plugin?.init?.(
        new PluginContext({
          name: plugin.name,
          ref: this.ref,
        })
      );
    }
  }

  public async onModuleDestroy() {
    const plugins = await this.load();
    for (const plugin of Object.values(plugins)) {
      await plugin?.destroy?.(
        new PluginContext({
          name: plugin.name,
          ref: this.ref,
        })
      );
    }
  }
}
