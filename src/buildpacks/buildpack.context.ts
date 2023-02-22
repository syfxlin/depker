import { LoadedBuildpack } from "./buildpack.type";
import { ProjectConfig } from "../types/config.type";
import { IMAGES, IS_DEV, IS_WIN, NAMES, VOLUMES } from "../constants/depker.constant";
import { cli, config, deploys, docker, logger, traefiks } from "../bin";
import path from "path";
import { Environment, FileSystemLoader } from "nunjucks";
import fs from "fs-extra";

export type BuildpackOptions = {
  id: string;
  target: string;
  config: ProjectConfig;
  buildpack: LoadedBuildpack;
};

export interface FilterThis {
  env: Environment;
  ctx: any;
}

export class BuildpackContext {
  // constants
  public static readonly IS_DEV = IS_DEV;
  public static readonly IS_WIN = IS_WIN;
  public static readonly NAMES: Readonly<typeof NAMES> = NAMES;
  public static readonly IMAGES: Readonly<typeof IMAGES> = IMAGES;
  public static readonly VOLUMES: Readonly<typeof VOLUMES> = VOLUMES;

  // values
  public readonly id: string;
  public readonly name: string;
  public readonly target: string;
  public readonly config: ProjectConfig;
  public readonly buildpack: LoadedBuildpack;

  // services
  public readonly $cli = cli;
  public readonly $logger = logger;
  public readonly $config = config;
  public readonly $docker = docker;
  public readonly $deploy = deploys;
  public readonly $traefik = traefiks;

  constructor(options: BuildpackOptions) {
    this.id = options.id;
    this.name = options.config.name;
    this.target = options.target;
    this.config = options.config;
    this.buildpack = options.buildpack;
  }

  public dockerfile(data: string) {
    const file = "Dockerfile";
    fs.outputFileSync(path.join(this.target, file), data, "utf-8");
    return file;
  }

  public exists(file: string) {
    return fs.pathExistsSync(path.join(this.target, file));
  }

  public read(file: string) {
    return fs.readFileSync(path.join(this.target, file), { encoding: "utf-8" });
  }

  public write(file: string, data: string) {
    if (this.exists(file)) {
      return file;
    }
    this.overwrite(file, data);
    return file;
  }

  public overwrite(file: string, data: string) {
    fs.outputFileSync(path.join(this.target, file), data, "utf-8");
    return file;
  }

  public async render(value: string, context?: Record<string, any>) {
    // template
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const config = await this.$config.remote();
    const template = new Environment(new FileSystemLoader(this.target), { autoescape: false, noCache: true });
    // functions
    template.addGlobal("ctx", self);
    template.addGlobal("env", process.env);
    template.addGlobal("process", process);
    template.addGlobal("secrets", config.secrets);
    template.addGlobal("options", config.options);
    template.addGlobal("id", this.id);
    template.addGlobal("name", this.name);
    template.addGlobal("target", this.target);
    template.addGlobal("config", this.config);
    template.addGlobal("buildpack", this.buildpack);
    // filters
    template.addFilter("command", function (value: string | string[]) {
      return typeof value === "string" ? value : JSON.stringify(value);
    });
    template.addFilter("render", function (this: FilterThis, value: string) {
      return value ? this.env.renderString(value, this.ctx) : "";
    });
    template.addFilter("exists", function (file: string) {
      return self.exists(file);
    });
    template.addFilter("read", function (file: string) {
      return self.read(file);
    });
    template.addFilter("write", function (value: string, file: string) {
      return self.write(file, value);
    });
    template.addFilter("overwrite", function (value: string, file: string) {
      return self.overwrite(file, value);
    });
    template.addFilter("render_write", function (this: FilterThis, value: string, file: string) {
      if (self.exists(file)) {
        const content = this.env.renderString(self.read(file), this.ctx);
        return self.overwrite(file, content);
      } else {
        const content = value ? this.env.renderString(value, this.ctx) : "";
        return self.overwrite(file, content);
      }
    });
    template.addFilter("render_overwrite", function (this: FilterThis, value: string, file: string) {
      const content = value ? this.env.renderString(value, this.ctx) : "";
      return self.overwrite(file, content);
    });
    return template.renderString(value, context ?? {});
  }

  public async deploy(config?: Partial<ProjectConfig>) {
    return this.deployAt(this.id, this.target, { ...this.config, ...config });
  }

  public async deployAt(id: string, target: string, config: ProjectConfig) {
    return this.$deploy._start(id, await this.$deploy._build(id, target, config), config);
  }
}
