import { logger } from "../bin";
import { execa, Options } from "execa";
import { IS_WIN, NAMES } from "../constants/depker.constant";
import {
  ContainerBuildOptions,
  ContainerCreateOptions,
  ContainerExecOptions,
  ContainerInfo,
  ContainerInspect,
  ContainerLogsOptions,
  ContainerRunOptions,
  ImageInfo,
  NetworkInfo,
  VolumeInfo,
  VolumeInspect,
} from "../types/docker.type";
import { Command } from "commander";

export class DockerService {
  // values
  private readonly cli: Command;
  public readonly containers = new DockerContainers(this);
  public readonly images = new DockerImages(this);
  public readonly volumes = new DockerVolumes(this);
  public readonly networks = new DockerNetworks(this);

  constructor(cli: Command) {
    this.cli = cli;
  }

  public execute(commands: string[], options?: Options) {
    return execa(IS_WIN ? "docker.exe" : "docker", commands, {
      ...options,
      env: {
        ...options?.env,
        DOCKER_BUILDKIT: `1`,
      },
    });
  }

  public async prune() {
    await Promise.all([this.images.prune(), this.volumes.prune(), this.networks.prune()]);
  }
}

export class DockerContainers {
  constructor(private readonly docker: DockerService) {}

  public async list(filters?: string[]): Promise<Array<ContainerInfo>> {
    const commands = [`container`, `ls`, `--all`, `--no-trunc`, `--format`, `{{json .}}`];
    for (const filter of filters ?? []) {
      commands.push(`--filter`);
      commands.push(filter);
    }
    const { stdout } = await this.docker.execute(commands);
    return stdout.split("\n").map((i) => {
      const data = JSON.parse(i);
      data.Name = data.Names;
      data.CreatedAt = new Date(data.CreatedAt).toISOString();
      return data;
    });
  }

  public async find(name: string): Promise<ContainerInfo | undefined> {
    const infos = await this.list();
    return infos.find((c) => c.Name === name);
  }

  public async inspect(name: string): Promise<ContainerInspect>;
  public async inspect(name: string[]): Promise<ContainerInspect[]>;
  public async inspect(name: string | string[]): Promise<ContainerInspect | ContainerInspect[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `inspect`, ...names];
    const { stdout } = await this.docker.execute(commands);
    const data = JSON.parse(stdout).map((item: any) => {
      item.ID = item.Id;
      item.Name = item.Name.substring(1);
      return item;
    });
    return typeof name === "string" ? data[0] : data;
  }

  public async start(name: string): Promise<string>;
  public async start(name: string[]): Promise<string[]>;
  public async start(name: string | string[]): Promise<string | string[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `start`, ...names];
    const { stdout } = await this.docker.execute(commands);
    const data = stdout.split("\n");
    return typeof name === "string" ? data[0] : data;
  }

  public async stop(name: string): Promise<string>;
  public async stop(name: string[]): Promise<string[]>;
  public async stop(name: string | string[]): Promise<string | string[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `stop`, ...names];
    const { stdout } = await this.docker.execute(commands);
    const data = stdout.split("\n");
    return typeof name === "string" ? data[0] : data;
  }

  public async restart(name: string): Promise<string>;
  public async restart(name: string[]): Promise<string[]>;
  public async restart(name: string | string[]): Promise<string | string[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `restart`, ...names];
    const { stdout } = await this.docker.execute(commands);
    const data = stdout.split("\n");
    return typeof name === "string" ? data[0] : data;
  }

  public async kill(name: string): Promise<string>;
  public async kill(name: string[]): Promise<string[]>;
  public async kill(name: string | string[]): Promise<string | string[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `kill`, ...names];
    const { stdout } = await this.docker.execute(commands);
    const data = stdout.split("\n");
    return typeof name === "string" ? data[0] : data;
  }

  public async remove(name: string, force?: boolean): Promise<string>;
  public async remove(name: string[], force?: boolean): Promise<string[]>;
  public async remove(name: string | string[], force?: boolean): Promise<string | string[]> {
    const names = typeof name === "string" ? [name] : name;
    const commands = [`container`, `rm`, ...names];
    if (force) {
      commands.push(`--force`);
    }
    const { stdout } = await this.docker.execute(commands);
    const data = stdout.split("\n");
    return typeof name === "string" ? data[0] : data;
  }

  public async rename(name: string, rename: string) {
    const commands = [`container`, `rename`, name, rename];
    const { stdout } = await this.docker.execute(commands);
    return stdout;
  }

  public async build(name: string, target: string, options?: ContainerBuildOptions, execute?: Options) {
    const commands = [`build`, ...this._build_args(name, target, options)];
    await this.docker.execute(commands, { stdio: "inherit", ...execute });
  }

  public async create(name: string, image: string, options?: ContainerCreateOptions, execute?: Options) {
    const commands = [`container`, `create`, ...this._create_args(name, image, options)];
    const { stdout } = await this.docker.execute(commands, execute);
    return stdout;
  }

  public async run(name: string, image: string, options?: ContainerRunOptions, execute?: Options) {
    // prettier-ignore
    const commands = [`container`, `run`, ...this._run_args(name, image, options)];
    const { stdout } = await this.docker.execute(commands, execute);
    return stdout;
  }

  public async clear(name: string, force?: boolean) {
    const infos = await this.list();
    for (const info of infos) {
      const inspect = await this.inspect(info.ID);
      if (inspect.Config.Labels["depker.name"] === name && (force || inspect.Name !== name)) {
        try {
          await this.remove(inspect.Name, true);
        } catch (e) {
          logger.debug(`Purge container ${inspect.ID} failed.`, e);
        }
      }
    }
  }

  public async prune(filters?: string[]) {
    const commands = [`container`, `prune`, `--force`];
    for (const filter of filters ?? []) {
      commands.push(`--filter`);
      commands.push(filter);
    }
    const { stdout } = await this.docker.execute(commands);
    return stdout;
  }

  public exec(name: string, commands: string[], options?: ContainerExecOptions, execute?: Options) {
    const args = [`container`, `exec`, ...this._exec_args(name, commands, options)];
    return this.docker.execute(args, execute);
  }

  public stats(name: string, follow?: boolean, execute?: Options) {
    const commands = [`container`, `stats`, name, ...(follow ? [] : [`--no-stream`])];
    return this.docker.execute(commands, { stdio: "inherit", ...execute });
  }

  public logs(name: string, options?: ContainerLogsOptions, execute?: Options) {
    const commands = [`container`, `logs`, name];
    if (options?.follow) {
      commands.push(`--follow`);
    }
    if (options?.tail) {
      commands.push(`--tail`);
      commands.push(options.tail);
    }
    if (options?.since) {
      commands.push(`--since`);
      commands.push(options.since);
    }
    if (options?.until) {
      commands.push(`--until`);
      commands.push(options.until);
    }
    if (options?.timestamps) {
      commands.push(`--timestamps`);
    }
    return this.docker.execute(commands, { stdio: "inherit", ...execute });
  }

  public copy(source: string, target: string, execute?: Options) {
    const commands = [`container`, `cp`, `--archive`, `--follow-link`, source, target];
    return this.docker.execute(commands, { stdio: "inherit", ...execute });
  }

  public async top(name: string, follow?: boolean, execute?: Options) {
    const exec = async () => {
      const commands = [`container`, `top`, name];
      console.clear();
      await this.docker.execute(commands, { stdio: "inherit", ...execute });
    };

    await exec();

    if (follow) {
      const interval = setInterval(() => exec(), 5000);
      await new Promise<void>((resolve) =>
        process.on("SIGINT", () => {
          clearInterval(interval);
          resolve();
        })
      );
    }
  }

  public async input(name: string, commands: string[], input: string) {
    await this.exec(name, commands, { interactive: true }, { input });
  }

  public async output(name: string, commands: string[]) {
    const { stdout } = await this.exec(name, commands);
    return stdout;
  }

  private _create_args(name: string, image: string, options?: ContainerCreateOptions) {
    const args = [`--name`, name];

    // basic
    if (options?.restart) {
      args.push(`--restart`);
      args.push(options.restart);
    } else {
      args.push(`--restart`);
      args.push(`always`);
    }
    if (options?.pull) {
      args.push(`--pull`);
      args.push(options.pull);
    }
    if (options?.init) {
      args.push(`--init`);
    }
    if (options?.remove) {
      args.push(`--rm`);
    }
    for (const [name, value] of Object.entries(options?.envs ?? {})) {
      args.push(`--env`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.env_files ?? []) {
      args.push(`--env-file`);
      args.push(value);
    }
    for (const [name, value] of Object.entries(options?.labels ?? {})) {
      args.push(`--label`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.label_files ?? []) {
      args.push(`--label-file`);
      args.push(value);
    }
    for (const value of options?.ports ?? []) {
      args.push(`--publish`);
      args.push(value);
    }
    for (const value of options?.volumes ?? []) {
      args.push(`--volume`);
      args.push(value);
    }

    // healthcheck
    if (options?.healthcheck?.commands) {
      args.push(`--health-cmd`);
      args.push(options.healthcheck.commands.join(" "));
    }
    if (options?.healthcheck?.period) {
      args.push(`--health-start-period`);
      args.push(options.healthcheck.period);
    }
    if (options?.healthcheck?.interval) {
      args.push(`--health-interval`);
      args.push(options.healthcheck.interval);
    }
    if (options?.healthcheck?.retries) {
      args.push(`--health-retries`);
      args.push(options.healthcheck.retries);
    }
    if (options?.healthcheck?.timeout) {
      args.push(`--health-timeout`);
      args.push(options.healthcheck.timeout);
    }

    // network
    if (options?.mac) {
      args.push(`--mac-address`);
      args.push(options.mac);
    }
    if (options?.ipv4) {
      args.push(`--ip`);
      args.push(options.ipv4);
    }
    if (options?.ipv6) {
      args.push(`--ip6`);
      args.push(options.ipv6);
    }
    if (options?.host) {
      args.push(`--hostname`);
      args.push(options.host);
    }
    for (const value of options?.dns ?? []) {
      args.push(`--dns`);
      args.push(value);
    }
    for (const value of options?.networks ?? []) {
      args.push(`--network`);
      args.push(value);
    }
    for (const [host, ip] of Object.entries(options?.hosts ?? {})) {
      args.push(`--add-host`);
      args.push(`${host}:${ip}`);
    }

    // resources
    if (options?.cpu) {
      args.push(`--cpu-shares`);
      args.push(options.cpu);
    }
    if (options?.memory) {
      args.push(`--memory`);
      args.push(options.memory);
    }
    if (options?.oom_kill === false) {
      args.push(`--oom-kill-disable`);
    }

    // privilege
    if (options?.privileged) {
      args.push(`--privileged`);
    }
    for (const value of options?.cap_adds ?? []) {
      args.push(`--cap-add`);
      args.push(value);
    }
    for (const value of options?.cap_drops ?? []) {
      args.push(`--cap-drop`);
      args.push(value);
    }

    // runtime
    if (options?.user) {
      args.push(`--user`);
      args.push(options.user);
    }
    if (options?.workdir) {
      args.push(`--workdir`);
      args.push(options.workdir);
    }
    for (const value of options?.groups ?? []) {
      args.push(`--group-add`);
      args.push(value);
    }

    // extensions
    for (const value of options?.flags ?? []) {
      args.push(value);
    }

    // command
    if (options?.entrypoints?.length) {
      args.push(`--entrypoint`);
      args.push(options.entrypoints.join(" "));
    }
    if (options?.commands?.length) {
      args.push(...args);
    }

    // image
    args.push(image);

    return args;
  }

  private _run_args(name: string, image: string, options?: ContainerRunOptions) {
    return [...(options?.detach ? [`--detach`] : []), ...this._create_args(name, image, options)];
  }

  private _exec_args(name: string, commands: string[], options?: ContainerExecOptions) {
    const args: string[] = [];

    if (options?.tty) {
      args.push(`--tty`);
    }
    if (options?.detach) {
      args.push(`--detach`);
    }
    if (options?.interactive) {
      args.push(`--interactive`);
    }
    if (options?.privileged) {
      args.push(`--privileged`);
    }
    if (options?.user) {
      args.push(`--user`);
      args.push(options.user);
    }
    if (options?.workdir) {
      args.push(`--workdir`);
      args.push(options.workdir);
    }
    for (const [name, value] of Object.entries(options?.envs ?? {})) {
      args.push(`--env`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.env_files ?? []) {
      args.push(`--env-file`);
      args.push(value);
    }

    args.push(name);
    args.push(...commands);
    return args;
  }

  private _build_args(name: string, target: string, options?: ContainerBuildOptions) {
    const args = [`--tag`, name];

    if (options?.file) {
      args.push(`--file`);
      args.push(options.file);
    }
    if (options?.pull) {
      args.push(`--pull`);
      args.push(`--no-cache`);
    }
    if (options?.remove) {
      args.push(`--rm`);
    }
    for (const [name, value] of Object.entries(options?.args ?? {})) {
      args.push(`--build-arg`);
      args.push(`${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options?.labels ?? {})) {
      args.push(`--label`);
      args.push(`${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options?.secrets ?? {})) {
      args.push(`--secret`);
      args.push(`id=${name},src=${value}`);
    }
    for (const [name, value] of Object.entries(options?.hosts ?? {})) {
      args.push(`--add-host`);
      args.push(`${name}:${value}`);
    }
    for (const name of options?.networks ?? []) {
      args.push(`--network`);
      args.push(name);
    }

    // extensions
    for (const value of options?.flags ?? []) {
      args.push(value);
    }

    args.push(target);

    return args;
  }
}

export class DockerImages {
  constructor(private readonly docker: DockerService) {}

  public async list(filters?: string[]): Promise<Array<ImageInfo>> {
    const commands = [`image`, `ls`, `--no-trunc`, `--format`, `{{json .}}`];
    for (const filter of filters ?? []) {
      commands.push(`--filter`);
      commands.push(filter);
    }
    const { stdout } = await this.docker.execute(commands);
    return stdout.split("\n").map((i) => {
      const data = JSON.parse(i);
      data.CreatedAt = new Date(data.CreatedAt).toISOString();
      return data;
    });
  }

  public async pull(name: string, force?: boolean): Promise<string> {
    const full = name.indexOf(":") !== -1 ? name : `${name}:latest`;
    const infos = await this.list();
    const info = infos.find((i) => `${i.Repository}:${i.Tag}` === full);
    if (force || !info) {
      const commands = [`image`, `pull`, full];
      await this.docker.execute(commands, { stdio: "inherit" });
    }
    return name;
  }

  public async prune() {
    const commands = [`image`, `prune`, `--force`, `--all`, `--filter`, `until=24h`];
    await this.docker.execute(commands);
  }
}

export class DockerNetworks {
  constructor(private readonly docker: DockerService) {}

  public async list(filters?: string[]): Promise<Array<NetworkInfo>> {
    const commands = [`network`, `ls`, `--no-trunc`, `--format`, `{{json .}}`];
    for (const filter of filters ?? []) {
      commands.push(`--filter`);
      commands.push(filter);
    }
    const { stdout } = await this.docker.execute(commands);
    return stdout.split("\n").map((i) => {
      const data = JSON.parse(i);
      data.CreatedAt = new Date(data.CreatedAt).toISOString();
      return data;
    });
  }

  public async depker() {
    const infos = await this.list();
    const info = infos.find((n) => n.Name === NAMES.DEPKER);
    if (!info) {
      const commands = [`network`, `create`, NAMES.DEPKER];
      await this.docker.execute(commands);
    }
    return NAMES.DEPKER;
  }

  public async prune() {
    const commands = [`network`, `prune`, `--force`, `--filter`, `until=24h`];
    await this.docker.execute(commands);
  }
}

export class DockerVolumes {
  constructor(private readonly docker: DockerService) {}

  public async list(filters?: string[]): Promise<Array<VolumeInfo>> {
    const commands = [`volume`, `ls`, `--format`, `{{json .}}`];
    for (const filter of filters ?? []) {
      commands.push(`--filter`);
      commands.push(filter);
    }
    const { stdout } = await this.docker.execute(commands);
    return stdout.split("\n").map((i) => JSON.parse(i));
  }

  public async prune() {
    const list = async (): Promise<string[]> => {
      const { stdout } = await this.docker.execute([`volume`, `ls`, `--quiet`, `--filter`, `dangling=true`]);
      return stdout.split("\n");
    };

    const inspect = async (ids: string[]): Promise<VolumeInspect[]> => {
      const { stdout } = await this.docker.execute([`volume`, `inspect`, `--format`, `{{json .}}`, ...ids]);
      return stdout.split("\n").map((i) => JSON.parse(i));
    };

    const filter = async (infos: VolumeInspect[]) => {
      return infos
        .filter((i) => /^[0-9a-f]{64}$/.test(i.Name))
        .filter((i) => Math.abs(Date.now() - new Date(i.CreatedAt).getTime()) > 86_400_000)
        .map((i) => i.Name);
    };

    const ids = await filter(await inspect(await list()));
    if (ids.length) {
      await this.docker.execute([`volume`, `rm`, ...ids]);
    }
  }
}
