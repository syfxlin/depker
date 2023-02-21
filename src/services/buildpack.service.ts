import { LoadedBuildpack } from "../buildpacks/buildpack.type";
import path from "path";
import { pathToFileURL } from "url";
import { internal } from "../buildpacks/internal.plugin";
import fs from "fs-extra";
import { config, logger } from "../bin";
import { IS_WIN } from "../constants/depker.constant";
import { execa } from "execa";
import { Command } from "commander";

export class BuildpackService {
  constructor(private readonly cli: Command) {}

  private _loaded = false;
  private _internal: Record<string, LoadedBuildpack> = {};
  private _external: Record<string, LoadedBuildpack> = {};

  public async get(name: string): Promise<LoadedBuildpack> {
    const buildpacks = await this.load();
    return buildpacks[name];
  }

  public async load(force?: boolean): Promise<Record<string, LoadedBuildpack>> {
    if (!this._loaded || force) {
      // log started
      logger.debug(`Buildpacks loading started.`);

      // reset
      this._internal = {};
      this._external = {};

      // internal
      for (const plugin of internal) {
        this._internal[plugin.name] = plugin;
        logger.debug(`Internal buildpack ${plugin.name} loading completed.`);
      }

      // external
      const root = path.join(config.root, "buildpacks");
      const file = path.join(root, "package.json");

      // ensure package.json
      if (!(await fs.pathExists(file))) {
        await fs.ensureDir(root);
        await execa(IS_WIN ? "npm.cmd" : "npm", ["init", "-y", "--silent"], { cwd: root });
      }

      const json = await fs.readJson(file);
      const packages = Object.keys(json.dependencies || {});
      for (const name of packages) {
        const dir = path.join(root, "node_modules", name);
        const pjs = await fs.readJson(path.join(dir, "package.json"));
        const idx = path.join(dir, pjs.main ?? "index.js");
        const mod = await import(pathToFileURL(idx).toString());
        const ext = mod.default ?? mod;
        this._external[name] = { name, directory: dir, ...ext };
        logger.debug(`External buildpack ${name} loading completed.`);
      }

      // mark
      this._loaded = true;

      // log done
      logger.debug(`Buildpacks loaded successfully.`);
    }
    return { ...this._internal, ...this._external };
  }

  public async install(name: string, force?: boolean) {
    const buildpacks = await this.load();
    if (buildpacks[name] && !force) {
      logger.debug(`Buildpack ${name} already installed.`);
      return;
    }
    const root = path.join(config.root, "buildpacks");
    const returns = await execa(IS_WIN ? "npm.cmd" : "npm", ["install", name], { cwd: root });
    // prettier-ignore
    logger.debug(`Buildpack installing ${name} ${returns.exitCode === 0 ? `successfully` : `failed`}. stdout=${returns.stdout}, stderr=${returns.stderr}`);
    if (returns.exitCode !== 0) {
      throw new Error(`Exit code is ${returns.exitCode}`);
    }
    await this.load(true);
  }

  public async uninstall(name: string, force?: boolean) {
    const buildpacks = await this.load();
    if (!buildpacks[name] && !force) {
      logger.debug(`Buildpack ${name} already uninstalled.`);
      return;
    }
    const root = path.join(config.root, "buildpacks");
    const returns = await execa(IS_WIN ? "npm.cmd" : "npm", ["uninstall", name], { cwd: root });
    // prettier-ignore
    logger.debug(`Buildpack uninstalling ${name} ${returns.exitCode === 0 ? `successfully` : `failed`}. stdout=${returns.stdout}, stderr=${returns.stderr}`);
    if (returns.exitCode !== 0) {
      throw new Error(`Exit code is ${returns.exitCode}`);
    }
    await this.load(true);
  }
}
