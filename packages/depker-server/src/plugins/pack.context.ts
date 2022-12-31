import { Deploy } from "../entities/deploy.entity";
import { PluginContext, PluginOptions } from "./plugin.context";
import fs from "fs-extra";
import path from "path";
import { Service } from "../entities/service.entity";
import { DeployBuildOptions, DeployStartOptions } from "../services/deploy.service";
import { LogFunc } from "../types";
import { Environment, FileSystemLoader } from "nunjucks";

export interface PackOptions extends PluginOptions {
  project: string;
  deploy: Deploy;
}

export interface FilterThis {
  env: Environment;
  ctx: any;
}

export class PackContext extends PluginContext {
  // logger
  public readonly log: LogFunc;

  // values
  public readonly project: string;
  public readonly deploy: Deploy;

  constructor(options: PackOptions) {
    super(options);
    this.deploy = options.deploy;
    this.project = options.project;
    this.log = options.deploy.logger;
  }

  public dockerfile(data: string) {
    const file = "Dockerfile";
    fs.outputFileSync(path.join(this.project, file), data, "utf-8");
    return file;
  }

  public exists(file: string) {
    return fs.pathExistsSync(path.join(this.project, file));
  }

  public read(file: string) {
    return fs.readFileSync(path.join(this.project, file), { encoding: "utf-8" });
  }

  public write(file: string, data: string) {
    if (this.exists(file)) {
      return file;
    }
    this.overwrite(file, data);
    return file;
  }

  public overwrite(file: string, data: string) {
    fs.outputFileSync(path.join(this.project, file), data, "utf-8");
    return file;
  }

  public render(value: string, context: Record<string, any>) {
    // template
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const template = new Environment(new FileSystemLoader(this.project), {
      autoescape: false,
      noCache: true,
    });
    // filter
    template.addFilter("inject", function (this: FilterThis, value: string) {
      if (!value) {
        return "";
      }
      return this.env.renderString(value, this.ctx);
    });
    template.addFilter("render", function (this: FilterThis, value: string) {
      if (!value) {
        return "";
      }
      return this.env.renderString(value, this.ctx);
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
    return template.renderString(value, context);
  }

  public async extensions(name?: string, value?: any) {
    const values = this.deploy.service.extensions ?? {};
    if (!name) {
      return values;
    } else if (value === undefined) {
      return values[name];
    } else if (value === null) {
      delete values[name];
    } else {
      values[name] = value;
    }
    this.deploy.service.extensions = values;
    await Service.save(this.deploy.service);
  }

  public async deployment(build?: string | DeployBuildOptions, start?: DeployStartOptions) {
    const service = this.deploy.service;
    const name = service.name;
    const project = this.project;

    const _build_opts = (options: DeployBuildOptions): DeployBuildOptions => ({
      pull: options.pull ?? service.pull,
      cache: options.pull ?? service.pull,
      args: {
        ...service.buildArgs,
        ...options.args,
      },
      hosts: {
        ...service.hosts.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.hosts,
      },
      labels: {
        ...service.labels.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.labels,
      },
      secrets: {
        ...service.secrets.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.secrets,
      },
    });

    const _start_opts = (options: DeployStartOptions): DeployStartOptions => ({
      ports: [...service.ports, ...(options.ports ?? [])],
      volumes: [...service.volumes, ...(options.volumes ?? [])],
      labels: {
        ...service.labels.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.labels,
      },
      secrets: {
        ...service.secrets.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.secrets,
      },
      hosts: {
        ...service.hosts.filter((i) => i.onbuild).reduce((a, i) => ({ ...a, [i.name]: i.value }), {}),
        ...options.hosts,
      },
      networks: {
        ...service.networks,
        ...options.networks,
      },
      commands: options.commands ?? service.commands,
      entrypoints: options.entrypoints ?? service.entrypoints,
      restart: options.restart ?? service.restart,
      healthcheck: {
        ...service.healthcheck,
        ...options.healthcheck,
      },
      init: options.init ?? service.init,
      rm: options.rm ?? service.rm,
      privileged: options.privileged ?? service.privileged,
      user: options.user ?? service.user,
      workdir: options.workdir ?? service.workdir,
      domain: options.domain ?? service.domain,
      rule: options.rule ?? service.rule,
      port: options.port ?? service.port,
      scheme: options.scheme ?? service.scheme,
      tls: options.tls ?? service.tls,
      middlewares: options.middlewares ?? service.middlewares,
    });

    const _build = async () => {
      if (typeof build === "string") {
        await this.dockerfile(`FROM ${build}`);
        return await this.deploys._build({ name, project, options: _build_opts({}), logger: this.log });
      } else {
        return await this.deploys._build({ name, project, options: _build_opts(build ?? {}), logger: this.log });
      }
    };

    const _start = async (image: string) => {
      if (service.type === "app") {
        return await this.deploys._start({ name, image, options: _start_opts(start ?? {}), logger: this.log });
      } else {
        const cron = await this.extensions("cron");
        return await this.deploys._cron({ name, image, cron, options: _start_opts(start ?? {}), logger: this.log });
      }
    };

    return await _start(await _build());
  }
}
