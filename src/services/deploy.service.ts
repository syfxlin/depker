import path from "path";
import os from "os";
import { buildpacks, config, docker, logger } from "../bin";
import { ProjectConfig } from "../types/config.type";
import { Environment } from "nunjucks";
import YAML from "yaml";
import fs from "fs-extra";
import { BuildpackContext } from "../buildpacks/buildpack.context";
import { ContainerBuildOptions, ContainerCreateOptions } from "../types/docker.type";
import { NAMES } from "../constants/depker.constant";
import { Command } from "commander";
import ignore from "ignore";

export class DeployService {
  constructor(private readonly cli: Command) {}

  public async deploy(project: string) {
    const { id, target, config } = await this._unpack(project);

    // log started
    logger.step(`Deployment service ${config.name} started.`);

    try {
      // find buildpack
      const buildpack = await buildpacks.get(config.buildpack);
      if (!buildpack) {
        throw new Error(`Not found buildpack ${config.buildpack}`);
      }

      // create context
      const context = new BuildpackContext({ id, target, config, buildpack });

      // emit init event
      logger.debug(`Deployment service ${config.name} initing.`);
      buildpack.init?.(context);

      // purge residual containers
      logger.step(`Purge ${config.name} residual containers started.`);
      await docker.containers.clear(config.name);

      // deployment containers
      logger.debug(`Deployment service ${config.name} building.`);
      await buildpack.build?.(context);

      // purge containers
      logger.step(`Purge ${config.name} containers started.`);
      await docker.containers.clear(config.name);

      // purge images and volumes
      await docker.prune();

      // emit destroy event
      logger.debug(`Deployment service ${config.name} destroying.`);
      await buildpack.destroy?.(context);

      // log successfully
      logger.done(`Deployment service ${config.name} successfully.`);
    } catch (e) {
      // log failed
      await logger.error(`Deployment service ${config.name} failure.`, e);
      throw new Error(`Deployment service ${config.name} failure.`, { cause: e });
    } finally {
      // await fs.remove(target);
    }
  }

  public async _unpack(project: string) {
    // values
    const id = String(Date.now());
    const source = project;
    const target = path.join(os.tmpdir(), `deploy-${id}`);

    // copy project
    logger.info(`Unpacking service project started.`);
    // create ignore
    const ig = ignore();
    const gi = path.join(source, ".gitignore");
    const di = path.join(source, ".depkerignore");
    if (await fs.pathExists(gi)) {
      ig.add(await fs.readFile(gi, "utf-8"));
    }
    if (await fs.pathExists(di)) {
      ig.add(await fs.readFile(di, "utf-8"));
    }
    // copy files
    await fs.copy(source, target, {
      filter: (src) => {
        const relative = path.relative(source, src);
        return !relative || !ig.ignores(relative);
      },
    });
    logger.done(`Unpacking service project successfully.`);

    // read config
    logger.step(`Reading project config started.`);
    const config = await this._config(target);
    logger.done(`Reading project config successfully.`);

    return { id, target, config };
  }

  public async _build(id: string, target: string, config: ProjectConfig) {
    const image = `depker-${config.name}:${id}`;
    const secrets = path.join(os.tmpdir(), `secrets-${id}`);

    // options
    const options: ContainerBuildOptions = {
      pull: config.pull,
      cache: config.cache,
      args: config.build_args,
      hosts: config.hosts,
      labels: config.labels,
      secrets: { secrets },
    };

    // log started
    await logger.step(`Building image ${image} started.`);

    try {
      // write secrets
      // prettier-ignore
      await fs.outputFile(secrets, Object.entries(config.secrets ?? {}).map(([n, v]) => `export ${n}=${v}\n`).join(""));

      // write dockerfile
      if (config.buildpack === "image") {
        const file = path.join(target, `Dockerfile`);
        await fs.outputFile(file, `FROM ${config.image}`);
        options.file = file;
      } else if (config.buildpack === "dockerfile" && config.dockerfile) {
        const file = path.join(target, `Dockerfile`);
        await fs.outputFile(file, config.dockerfile);
        options.file = file;
      }

      // build image
      await docker.containers.build(image, target, options);

      // log successfully
      await logger.done(`Building image ${image} successfully.`);
      return image;
    } catch (e) {
      // log failed
      await logger.error(`Building image ${image} failure.`);
      throw new Error(`Build image ${image} failure.`);
    }
  }

  public async _create(id: string, target: string, config: ProjectConfig) {
    // values
    const name = config.name;
    const buildpack = config.buildpack;
    const rename = `${name}-${id}`;

    // args
    const network = await docker.networks.depker();
    const envs: Record<string, string> = {
      ...config.secrets,
      DEPKER_ID: id,
      DEPKER_NAME: name,
      DEPKER_IMAGE: target,
      DEPKER_BUILDPACK: buildpack,
    };
    const labels: Record<string, string> = {
      ...config.labels,
      "depker.id": id,
      "depker.name": name,
      "depker.image": target,
      "depker.buildpack": buildpack,
      "traefik.enable": "true",
      "traefik.docker.network": network,
    };
    const options: ContainerCreateOptions = {
      // basic
      restart: config.restart,
      commands: config.commands,
      entrypoints: config.entrypoints,
      init: config.init,
      remove: config.remove,
      envs: envs,
      labels: labels,
      // healthcheck
      healthcheck: config.healthcheck,
      // networks
      mac: config.mac,
      dns: config.dns,
      ipv4: config.ipv4,
      ipv6: config.ipv6,
      host: config.host,
      hosts: config.hosts,
      network: network,
      networks: config.networks,
      // resources
      cpu: config.cpu,
      memory: config.memory,
      oom_kill: config.oom_kill,
      // privilege
      privileged: config.privileged,
      cap_adds: config.cap_adds,
      cap_drops: config.cap_drops,
      // runtime
      user: config.user,
      workdir: config.workdir,
      groups: config.groups,
    };

    // web
    // prettier-ignore
    if (config.rule || config.domain?.length) {
      const rule = (config.rule || [config.domain]?.flat()?.map((d) => `Host(\`${d}\`)`).join(" || "));
      const port = config.port ?? 80;
      const scheme = config.scheme ?? "http";
      const middlewares: string[] = [];

      // service
      labels[`traefik.http.routers.${name}-${id}.service`] = `${name}-${id}`;
      labels[`traefik.http.services.${name}-${id}.loadbalancer.server.scheme`] = scheme;
      labels[`traefik.http.services.${name}-${id}.loadbalancer.server.port`] = String(port);

      // route
      if (config.tls) {
        // https
        labels[`traefik.http.routers.${name}-${id}.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}.entrypoints`] = "https";
        labels[`traefik.http.routers.${name}-${id}.tls.certresolver`] = NAMES.DEPKER;
        // http
        labels[`traefik.http.routers.${name}-${id}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}-http.entrypoints`] = "http";
        labels[`traefik.http.routers.${name}-${id}-http.middlewares`] = `${name}-${id}-https`;
        labels[`traefik.http.middlewares.${name}-${id}-https.redirectscheme.scheme`] = "https";
        middlewares.push(`${name}-${id}-https`);
      } else {
        // http
        labels[`traefik.http.routers.${name}-${id}-http.rule`] = rule;
        labels[`traefik.http.routers.${name}-${id}-http.entrypoints`] = "http";
      }

      // middleware
      for (const middleware of config.middlewares ?? []) {
        for (const [k, v] of Object.entries(middleware.options ?? {})) {
          labels[`traefik.http.middlewares.${name}-${id}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${id}-${middleware.name}`);
        }
      }
      labels[`traefik.http.routers.${name}-${id}.middlewares`] = [...new Set(middlewares)].join(",");
    }

    // ports
    // prettier-ignore
    for (const port of config.ports ?? []) {
      const proto = port.proto;
      const hport = port.hport;
      const cport = port.cport;
      if (proto === "tcp") {
        labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.rule`] = "HostSNI(`*`)";
      }
      labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.entrypoints`] = `${proto}${hport}`;
      labels[`traefik.${proto}.routers.${name}-${id}-${proto}-${cport}.service`] = `${name}-${id}-${proto}-${cport}`;
      labels[`traefik.${proto}.services.${name}-${id}-${proto}-${cport}.loadbalancer.server.port`] = String(cport);
    }

    // volumes
    for (const volume of config.volumes ?? []) {
      if (!options.volumes) {
        options.volumes = [];
      }
      options.volumes.push(`${volume.hpath}:${volume.cpath}:${volume.readonly ? "ro" : "rw"}`);
    }

    try {
      // create container
      await docker.containers.create(rename, target, options);
      // log successfully
      await logger.done(`Create container ${name} successfully.`);
      return rename;
    } catch (e: any) {
      // log failed
      await logger.error(`Create container ${name} failure.`, e);
      throw new Error(`Create container ${name} failure.`, { cause: e });
    }
  }

  public async _start(id: string, target: string, config: ProjectConfig) {
    // values
    const name = config.name;

    // logger
    await logger.step(`Start container ${name} started.`);

    // running
    const running = (await docker.containers.find(name))?.ID;

    // create
    const deploying = await this._create(id, target, config);

    try {
      // start
      await docker.containers.start(deploying);

      // wait healthcheck, max timeout 1h
      await logger.info(`Waiting container ${name} to finished.`);
      for (let i = 1; i <= 1200; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const info = await docker.containers.inspect(deploying);
        const status = info.State.Status.toLowerCase();
        const health = info.State.Health?.Status?.toLowerCase();
        if (status !== "created" && health !== "starting") {
          if (status === "running" && (!health || health === "healthy")) {
            break;
          } else {
            throw new Error(`Start container ${name} is unhealthy.`);
          }
        }
        if (i % 10 === 0) {
          await logger.info(`Waiting... ${i * 3}s`);
        }
      }

      // rename
      try {
        if (running) {
          await docker.containers.stop(running);
        }
      } catch (e) {
        // ignore
      }
      try {
        if (running) {
          await docker.containers.rename(running, `${name}-${Date.now()}`);
        }
      } catch (e) {
        // ignore
      }

      await docker.containers.rename(deploying, name);
      await logger.done(`Start container ${name} successfully.`);
      return deploying;
    } catch (e: any) {
      // rename
      try {
        if (running) {
          await docker.containers.start(running);
        }
      } catch (e) {
        // ignore
      }
      try {
        if (running) {
          await docker.containers.rename(running, name);
        }
      } catch (e) {
        // ignore
      }

      // print logs
      await logger.error(`Start container ${name} failure.`, e);
      throw new Error(`Start container ${name} failure.`, { cause: e });
    }
  }

  private async _config(project: string): Promise<ProjectConfig> {
    const parse = async (content: string) => {
      const template = new Environment(null, { autoescape: false, noCache: true });
      const values = await config.remote();
      template.addGlobal("env", process.env);
      template.addGlobal("process", process);
      template.addGlobal("secrets", values.secrets);
      template.addGlobal("options", values.options);
      return YAML.parse(template.renderString(content, process.env));
    };

    // validate path
    if (!(await fs.pathExists(project))) {
      throw new Error(`Project path [${project}] not found.`);
    }

    // validate config
    try {
      const pc = path.join(project, ".depker.yml");
      const sc = path.join(project, ".depker", "depker.yml");
      if (await fs.pathExists(pc)) {
        return parse(await fs.readFile(pc, "utf-8"));
      } else if (await fs.pathExists(sc)) {
        return parse(await fs.readFile(sc, "utf-8"));
      } else {
        const content = YAML.stringify({ name: path.basename(project) });
        await fs.writeFile(pc, content);
        return parse(content);
      }
    } catch (e) {
      throw new Error(`Project config depker.yml is not valid.`, { cause: e });
    }
  }
}
