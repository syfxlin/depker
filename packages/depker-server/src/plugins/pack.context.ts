import { Deploy } from "../entities/deploy.entity";
import { PluginContext, PluginOptions } from "./plugin.context";
import { DeployLogger } from "../entities/log.entity";
import fs from "fs-extra";
import path from "path";
import { Service } from "../entities/service.entity";
import { DeployBuildOptions, DeployStartOptions } from "../services/deploy.service";

export interface PackOptions extends PluginOptions {
  project: string;
  deploy: Deploy;
}

export class PackContext extends PluginContext {
  // logger
  public readonly log: DeployLogger;

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

    if (typeof build === "string") {
      await this.dockerfile(`FROM ${build}`);
      const image = await this.deploys.build(name, project, this.log, _build_opts({}));
      return await this.deploys.start(name, image, this.log, _start_opts(start ?? {}));
    } else {
      const image = await this.deploys.build(name, project, this.log, _build_opts(build ?? {}));
      return await this.deploys.start(name, image, this.log, _start_opts(start ?? {}));
    }
  }
}
