import {
  BuilderBuildOptions,
  BuilderOperation,
  ContainerCopyOptions,
  ContainerCreateOptions,
  ContainerExecOptions,
  ContainerInfo,
  ContainerInspect,
  ContainerKillOptions,
  ContainerLogsOptions,
  ContainerOperation,
  ContainerRemoveOptions,
  ContainerRestartOptions,
  ContainerRunOptions,
  containers,
  ContainerStartOptions,
  ContainerStatsOptions,
  ContainerStopOptions,
  ContainerTopOptions,
  ImageInfo,
  ImageInspect,
  ImageOperation,
  ImagePullOptions,
  ImagePushOptions,
  ImageRemoveOptions,
  images,
  NetworkConnectOptions,
  NetworkCreateOptions,
  NetworkDisconnectOptions,
  NetworkInfo,
  NetworkInspect,
  NetworkOperation,
  NetworkRemoveOptions,
  networks,
  VolumeCreateOptions,
  VolumeInfo,
  VolumeInspect,
  VolumeOperation,
  VolumeRemoveOptions,
  volumes,
} from "../types/results.type.ts";
import { DepkerMaster } from "../types/master.type.ts";
import { Depker } from "../depker.ts";
import { CommandBuilder } from "../deps.ts";

export type DockerNodeOptions =
  | {
      type: "local";
    }
  | {
      type: "context";
      name: string;
    }
  | {
      type: "ssh";
      host: string;
    }
  | {
      type: "http";
      host: string;
      port?: number | string;
    }
  | {
      type: "https";
      host: string;
      port?: number | string;
      ca?: string;
      cert?: string;
      key?: string;
      verify?: boolean;
    };

export function docker(options?: DockerNodeOptions) {
  return (depker: Depker) => new DockerNode(depker, options);
}

export class DockerNode implements DepkerMaster {
  public readonly docker: string[];
  public readonly container: DockerContainerOperation;
  public readonly builder: DockerBuilderOperation;
  public readonly network: DockerNetworkOperation;
  public readonly volume: DockerVolumeOperation;
  public readonly image: DockerImageOperation;

  constructor(depker: Depker, options?: DockerNodeOptions) {
    this.container = new DockerContainerOperation(depker, this);
    this.builder = new DockerBuilderOperation(depker, this);
    this.network = new DockerNetworkOperation(depker, this);
    this.volume = new DockerVolumeOperation(depker, this);
    this.image = new DockerImageOperation(depker, this);

    if (options?.type === "context") {
      this.docker = [`docker`, `--context`, options.name];
    } else if (options?.type === "ssh") {
      this.docker = [`docker`, `--host`, `ssh://${options.host}`];
    } else if (options?.type === "http") {
      this.docker = [`docker`, `--host`, `tcp://${options.host}:${options.port ?? 2375}`];
    } else if (options?.type === "https") {
      this.docker = [`docker`, `--host`, `tcp://${options.host}:${options.port ?? 2376}`];
      // ca
      if (options.ca) {
        const ca = Deno.makeTempFileSync();
        Deno.writeTextFileSync(ca, options.ca);
        this.docker.push(`--tlscacert`);
        this.docker.push(ca);
      }
      // cert
      if (options.cert) {
        const cert = Deno.makeTempFileSync();
        Deno.writeTextFileSync(cert, options.cert);
        this.docker.push(`--tlscert`);
        this.docker.push(cert);
      }
      // key
      if (options.key) {
        const key = Deno.makeTempFileSync();
        Deno.writeTextFileSync(key, options.key);
        this.docker.push(`--tlskey`);
        this.docker.push(key);
      }
      // verify
      if (options.verify !== false) {
        this.docker.push(`--tlsverify`);
      } else {
        this.docker.push(`--tls`);
      }
    } else {
      this.docker = [`docker`];
    }
  }
}

class DockerContainerOperation implements ContainerOperation {
  constructor(private readonly depker: Depker, private readonly node: DockerNode) {}

  private get docker() {
    return [...this.node.docker, `container`];
  }

  public async list(): Promise<Array<ContainerInfo>> {
    const infos = await this.depker.dax`${this.docker} ls --all --no-trunc --format '{{json .}}'`.jsonl<Array<any>>();
    return infos.map((info) => containers.info(info));
  }

  public async find(name: string): Promise<ContainerInfo | undefined> {
    const infos = await this.list();
    for (const info of infos) {
      if (info.Name === name) {
        return info;
      }
    }
    return undefined;
  }

  public async inspect(name: string[]): Promise<Array<ContainerInspect>> {
    const infos = await this.depker.dax`${this.docker} inspect ${name}`.json<Array<any>>();
    return infos.map((info) => containers.inspect(info));
  }

  public async start(name: string[], options?: ContainerStartOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Attach) {
      args.push(`--attach`);
    }
    if (options?.Interactive) {
      args.push(`--interactive`);
    }
    if (options?.DetachKeys) {
      args.push(`--detach-keys`);
      args.push(options.DetachKeys);
    }
    await this.depker.dax`${this.docker} start ${args} ${name}`;
  }

  public async stop(name: string[], options?: ContainerStopOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Time) {
      args.push(`--time`);
      args.push(options.Time);
    }
    if (options?.Signal) {
      args.push(`--signal`);
      args.push(options.Signal);
    }
    await this.depker.dax`${this.docker} stop ${args} ${name}`;
  }

  public async restart(name: string[], options?: ContainerRestartOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Time) {
      args.push(`--time`);
      args.push(options.Time);
    }
    if (options?.Signal) {
      args.push(`--signal`);
      args.push(options.Signal);
    }
    await this.depker.dax`${this.docker} restart ${args} ${name}`;
  }

  public async kill(name: string[], options?: ContainerKillOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Signal) {
      args.push(`--signal`);
      args.push(options.Signal);
    }
    await this.depker.dax`${this.docker} kill ${args} ${name}`;
  }

  public async remove(name: string[], options?: ContainerRemoveOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Force) {
      args.push(`--force`);
    }
    if (options?.Link) {
      args.push(`--link`);
    }
    if (options?.Volumes) {
      args.push(`--volumes`);
    }
    await this.depker.dax`${this.docker} rm ${args} ${name}`;
  }

  public async rename(name: string, rename: string): Promise<void> {
    await this.depker.dax`${this.docker} rename ${name} ${rename}`;
  }

  public async prune(): Promise<void> {
    await this.depker.dax`${this.docker} prune --force --filter until=24h`;
  }

  public create(name: string, target: string, options?: ContainerCreateOptions): CommandBuilder {
    return this.depker.dax`${this.docker} create ${this._create_args(name, target, options)}`;
  }

  public run(name: string, target: string, options?: ContainerRunOptions): CommandBuilder {
    return this.depker.dax`${this.docker} run ${this._run_args(name, target, options)}`;
  }

  public exec(name: string, commands: string[], options?: ContainerExecOptions): CommandBuilder {
    return this.depker.dax`${this.docker} exec ${this._exec_args(name, commands, options)}`;
  }

  public logs(name: string, options?: ContainerLogsOptions): CommandBuilder {
    const args: string[] = [];

    if (options?.Details) {
      args.push(`--details`);
    }
    if (options?.Follow) {
      args.push(`--follow`);
    }
    if (options?.Timestamps) {
      args.push(`--timestamps`);
    }
    if (options?.Tail) {
      args.push(`--tail`);
      args.push(options.Tail);
    }
    if (options?.Since) {
      args.push(`--since`);
      args.push(options.Since);
    }
    if (options?.Until) {
      args.push(`--until`);
      args.push(options.Until);
    }

    return this.depker.dax`${this.docker} logs ${name} ${args}`;
  }

  public top(name: string, options?: ContainerTopOptions): CommandBuilder {
    return this.depker.dax`${this.docker} top ${name} ${options?.Options ? [options.Options] : []}`;
  }

  public stats(name: string, options?: ContainerStatsOptions): CommandBuilder {
    const args: string[] = [];

    if (options?.All) {
      args.push(`--all`);
    }
    if (!options?.Stream) {
      args.push(`--no-stream`);
    }
    if (options?.NoTrunc) {
      args.push(`--no-trunc`);
    }

    return this.depker.dax`${this.docker} stats ${args} ${name}`;
  }

  public copy(source: string, target: string, options?: ContainerCopyOptions): CommandBuilder {
    const args: string[] = [];

    if (options?.Archive) {
      args.push(`--archive`);
    }
    if (options?.FollowLink) {
      args.push(`--follow-link`);
    }

    return this.depker.dax`${this.docker} cp ${args} ${source} ${target}`;
  }

  public async wait(name: string[]): Promise<void> {
    await this.depker.dax`${this.docker} wait ${name}`;
  }

  private _create_args(name: string, target: string, options?: ContainerCreateOptions) {
    const args: string[] = [`--name`, name];

    // basic
    if (options?.Restart) {
      args.push(`--restart`);
      args.push(options.Restart);
    } else {
      args.push(`--restart`);
      args.push(`always`);
    }
    if (options?.Pull) {
      args.push(`--pull`);
      args.push(options.Pull);
    }
    if (options?.Init) {
      args.push(`--init`);
    }
    if (options?.Remove) {
      args.push(`--rm`);
    }
    for (const [name, value] of Object.entries(options?.Envs ?? {})) {
      args.push(`--env`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.EnvFiles ?? []) {
      args.push(`--env-file`);
      args.push(value);
    }
    for (const [name, value] of Object.entries(options?.Labels ?? {})) {
      args.push(`--label`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.LabelFiles ?? []) {
      args.push(`--label-file`);
      args.push(value);
    }
    for (const value of options?.Ports ?? []) {
      args.push(`--publish`);
      args.push(value);
    }
    for (const value of options?.Volumes ?? []) {
      args.push(`--volume`);
      args.push(value);
    }

    // healthcheck
    if (options?.Healthcheck?.Test) {
      args.push(`--health-cmd`);
      args.push(options.Healthcheck.Test.join(" "));
    }
    if (options?.Healthcheck?.Period) {
      args.push(`--health-start-period`);
      args.push(options.Healthcheck.Period);
    }
    if (options?.Healthcheck?.Interval) {
      args.push(`--health-interval`);
      args.push(options.Healthcheck.Interval);
    }
    if (options?.Healthcheck?.Retries) {
      args.push(`--health-retries`);
      args.push(options.Healthcheck.Retries);
    }
    if (options?.Healthcheck?.Timeout) {
      args.push(`--health-timeout`);
      args.push(options.Healthcheck.Timeout);
    }

    // network
    if (options?.Mac) {
      args.push(`--mac-address`);
      args.push(options.Mac);
    }
    if (options?.IPv4) {
      args.push(`--ip`);
      args.push(options.IPv4);
    }
    if (options?.IPv6) {
      args.push(`--ip6`);
      args.push(options.IPv6);
    }
    if (options?.Host) {
      args.push(`--hostname`);
      args.push(options.Host);
    }
    if (options?.Network) {
      args.push(`--network`);
      args.push(options.Network);
    }
    for (const value of options?.Dns ?? []) {
      args.push(`--dns`);
      args.push(value);
    }
    for (const value of options?.Networks ?? []) {
      args.push(`--network`);
      args.push(value);
    }
    for (const [host, ip] of Object.entries(options?.Hosts ?? {})) {
      args.push(`--add-host`);
      args.push(`${host}:${ip}`);
    }

    // resources
    if (options?.Cpu) {
      args.push(`--cpu-shares`);
      args.push(options.Cpu);
    }
    if (options?.Memory) {
      args.push(`--memory`);
      args.push(options.Memory);
    }
    if (options?.OOMKill === false) {
      args.push(`--oom-kill-disable`);
    }

    // privilege
    if (options?.Privileged) {
      args.push(`--privileged`);
    }
    for (const value of options?.CapAdds ?? []) {
      args.push(`--cap-add`);
      args.push(value);
    }
    for (const value of options?.CapDrops ?? []) {
      args.push(`--cap-drop`);
      args.push(value);
    }

    // runtime
    if (options?.User) {
      args.push(`--user`);
      args.push(options.User);
    }
    if (options?.Workdir) {
      args.push(`--workdir`);
      args.push(options.Workdir);
    }
    for (const value of options?.Groups ?? []) {
      args.push(`--group-add`);
      args.push(value);
    }

    // extensions
    for (const value of options?.Flags ?? []) {
      args.push(value);
    }

    // entrypoint
    if (options?.EntryPoints?.length) {
      args.push(`--entrypoint`);
      args.push(options.EntryPoints.join(" "));
    }

    // image
    args.push(target);

    // command
    if (options?.Commands?.length) {
      args.push(...options.Commands);
    }

    return args;
  }

  private _run_args(name: string, image: string, options?: ContainerRunOptions) {
    const args: string[] = [];

    if (options?.Tty) {
      args.push(`--tty`);
    }
    if (options?.Detach) {
      args.push(`--detach`);
    }
    if (options?.Interactive) {
      args.push(`--interactive`);
    }
    if (options?.DetachKeys) {
      args.push(`--detach-keys`);
      args.push(options.DetachKeys);
    }

    return [...args, ...this._create_args(name, image, options)];
  }

  private _exec_args(name: string, commands: string[], options?: ContainerExecOptions) {
    const args: string[] = [];

    if (options?.Tty) {
      args.push(`--tty`);
    }
    if (options?.Detach) {
      args.push(`--detach`);
    }
    if (options?.Interactive) {
      args.push(`--interactive`);
    }
    if (options?.Privileged) {
      args.push(`--privileged`);
    }
    if (options?.User) {
      args.push(`--user`);
      args.push(options.User);
    }
    if (options?.Workdir) {
      args.push(`--workdir`);
      args.push(options.Workdir);
    }
    for (const [name, value] of Object.entries(options?.Envs ?? {})) {
      args.push(`--env`);
      args.push(`${name}=${value}`);
    }
    for (const value of options?.EnvFiles ?? []) {
      args.push(`--env-file`);
      args.push(value);
    }

    args.push(name);
    args.push(...commands);
    return args;
  }
}

class DockerBuilderOperation implements BuilderOperation {
  constructor(private readonly depker: Depker, private readonly node: DockerNode) {}

  public build(name: string, target: string, options?: BuilderBuildOptions): CommandBuilder {
    const args = [`--tag`, name];

    if (options?.File) {
      args.push(`--file`);
      args.push(options.File);
    }
    if (options?.Pull) {
      args.push(`--pull`);
    }
    if (options?.Cache === false) {
      args.push(`--no-cache`);
    }
    if (options?.Remove) {
      args.push(`--rm`);
    }
    for (const [name, value] of Object.entries(options?.Args ?? {})) {
      args.push(`--build-arg`);
      args.push(`${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options?.Labels ?? {})) {
      args.push(`--label`);
      args.push(`${name}=${value}`);
    }
    for (const [name, value] of Object.entries(options?.Secrets ?? {})) {
      args.push(`--secret`);
      args.push(`id=${name},src=${value}`);
    }
    for (const [name, value] of Object.entries(options?.Hosts ?? {})) {
      args.push(`--add-host`);
      args.push(`${name}:${value}`);
    }
    for (const name of options?.Networks ?? []) {
      args.push(`--network`);
      args.push(name);
    }

    // extensions
    for (const value of options?.Flags ?? []) {
      args.push(value);
    }

    return this.depker.dax`${this.node.docker} build ${args} ${target}`.env("DOCKER_BUILDKIT", "1");
  }

  public save(name: string): Deno.Command {
    const arg = [...this.node.docker, `save`, name];
    const bin = arg.shift() as string;
    return new Deno.Command(bin, { args: arg, stdin: "null", stdout: "piped", stderr: "piped" });
  }

  public load(): Deno.Command {
    const arg = [...this.node.docker, `load`, `--quiet`];
    const bin = arg.shift() as string;
    return new Deno.Command(bin, { args: arg, stdin: "piped", stdout: "null", stderr: "null" });
  }
}

class DockerNetworkOperation implements NetworkOperation {
  constructor(private readonly depker: Depker, private readonly node: DockerNode) {}

  private get docker() {
    return [...this.node.docker, `network`];
  }

  public async default(): Promise<string> {
    const name = "depker";
    const info = await this.find(name);
    if (!info) {
      await this.create(name);
    }
    return name;
  }

  public async list(): Promise<Array<NetworkInfo>> {
    const infos = await this.depker.dax`${this.docker} ls --no-trunc --format '{{json .}}'`.jsonl<Array<any>>();
    return infos.map((info) => networks.info(info));
  }

  public async find(name: string): Promise<NetworkInfo | undefined> {
    const infos = await this.list();
    for (const info of infos) {
      if (info.Name === name) {
        return info;
      }
    }
    return undefined;
  }

  public async inspect(name: string[]): Promise<Array<NetworkInspect>> {
    const infos = await this.depker.dax`${this.docker} inspect ${name}`.json<Array<any>>();
    return infos.map((info) => networks.inspect(info));
  }

  public async create(name: string, options?: NetworkCreateOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Driver) {
      args.push(`--driver`);
      args.push(options.Driver);
    }
    if (options?.Gateway) {
      args.push(`--gateway`);
      args.push(options.Gateway);
    }
    if (options?.Subnet) {
      args.push(`--subnet`);
      args.push(options.Subnet);
    }
    if (options?.IPRange) {
      args.push(`--ip-range`);
      args.push(options.IPRange);
    }
    if (options?.EnableIPv6) {
      args.push(`--ipv6`);
    }
    if (options?.Scope) {
      args.push(`--scope`);
      args.push(options.Scope);
    }
    if (options?.Internal) {
      args.push(`--internal`);
    }
    for (const [key, value] of Object.entries(options?.Options ?? {})) {
      args.push(`--opt`);
      args.push(`${key}=${value}`);
    }
    for (const [key, value] of Object.entries(options?.Labels ?? {})) {
      args.push(`--label`);
      args.push(`${key}=${value}`);
    }
    await this.depker.dax`${this.docker} create ${args} ${name}`;
  }

  public async remove(name: string[], options?: NetworkRemoveOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Force) {
      args.push(`--force`);
    }
    await this.depker.dax`${this.docker} rm ${args} ${name}`;
  }

  public async connect(name: string, container: string, options?: NetworkConnectOptions): Promise<void> {
    const args: string[] = [];
    if (options?.IPv4) {
      args.push(`--ip`);
      args.push(options.IPv4);
    }
    if (options?.IPv6) {
      args.push(`--ipv6`);
      args.push(options.IPv6);
    }
    for (const alias of options?.Alias ?? []) {
      args.push(`--alias`);
      args.push(alias);
    }
    await this.depker.dax`${this.docker} connect ${args} ${name} ${container}`;
  }

  public async disconnect(name: string, container: string, options?: NetworkDisconnectOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Force) {
      args.push(`--force`);
    }
    await this.depker.dax`${this.docker} disconnect ${args} ${name} ${container}`;
  }

  public async prune(): Promise<void> {
    await this.depker.dax`${this.docker} prune --force --filter until=24h`;
  }
}

class DockerVolumeOperation implements VolumeOperation {
  constructor(private readonly depker: Depker, private readonly node: DockerNode) {}

  private get docker() {
    return [...this.node.docker, `volume`];
  }

  public async list(): Promise<Array<VolumeInfo>> {
    const infos = await this.depker.dax`${this.docker} ls --format '{{json .}}'`.jsonl<Array<any>>();
    return infos.map((info) => volumes.info(info));
  }

  public async find(name: string): Promise<VolumeInfo | undefined> {
    const infos = await this.list();
    for (const info of infos) {
      if (info.Name === name) {
        return info;
      }
    }
    return undefined;
  }

  public async inspect(name: string[]): Promise<Array<VolumeInspect>> {
    const infos = await this.depker.dax`${this.docker} inspect ${name}`.json<Array<any>>();
    return infos.map((info) => volumes.inspect(info));
  }

  public async create(name: string, options?: VolumeCreateOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Driver) {
      args.push(`--driver`);
      args.push(options.Driver);
    }
    for (const [key, value] of Object.entries(options?.Options ?? {})) {
      args.push(`--opt`);
      args.push(`${key}=${value}`);
    }
    for (const [key, value] of Object.entries(options?.Labels ?? {})) {
      args.push(`--label`);
      args.push(`${key}=${value}`);
    }
    await this.depker.dax`${this.docker} create ${args} ${name}`;
  }

  public async remove(name: string[], options?: VolumeRemoveOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Force) {
      args.push(`--force`);
    }
    await this.depker.dax`${this.docker} rm ${args} ${name}`;
  }

  // prettier-ignore
  public async prune(): Promise<void> {
    const volumes = await this.depker.dax`${this.docker} ls --quiet --filter dangling=true`.lines();
    if (!volumes.length) {
      return;
    }
    const inspects = await this.depker.dax`${this.docker} inspect --format '{{json .}}' ${volumes}`.jsonl<Array<VolumeInspect>>();
    if (!inspects.length) {
      return;
    }
    const names = inspects.filter((i) => /^[0-9a-f]{64}$/.test(i.Name) && Math.abs(Date.now() - new Date(i.Created).getTime()) > 86_400_000).map((i) => i.Name);
    if (!names.length) {
      return;
    }
    await this.depker.dax`${this.docker} rm ${names}`;
  }
}

class DockerImageOperation implements ImageOperation {
  constructor(private readonly depker: Depker, private readonly node: DockerNode) {}

  private get docker() {
    return [...this.node.docker, `image`];
  }

  public async list(): Promise<Array<ImageInfo>> {
    const infos = await this.depker.dax`${this.docker} ls --no-trunc --format '{{json .}}'`.jsonl<Array<any>>();
    return infos.map((info) => images.info(info));
  }

  public async find(name: string): Promise<ImageInfo | undefined> {
    const infos = await this.list();
    for (const info of infos) {
      if (info.Repository === name || `${info.Repository}:${info.Tag}` === name) {
        return info;
      }
    }
    return undefined;
  }

  public async inspect(name: string[]): Promise<Array<ImageInspect>> {
    const infos = await this.depker.dax`${this.docker} inspect ${name}`.jsonl<Array<any>>();
    return infos.map((info) => images.inspect(info));
  }

  public pull(name: string, options?: ImagePullOptions): CommandBuilder {
    const args: string[] = [];
    if (options?.AllTags) {
      args.push(`--all-tags`);
    }
    if (options?.Platform) {
      args.push(`--platform`);
      args.push(options.Platform);
    }
    return this.depker.dax`${this.docker} pull ${args} ${name}`;
  }

  public push(name: string, options?: ImagePushOptions): CommandBuilder {
    const args: string[] = [];
    if (options?.AllTags) {
      args.push(`--all-tags`);
    }
    return this.depker.dax`${this.docker} pull ${args} ${name}`;
  }

  public async remove(name: string[], options?: ImageRemoveOptions): Promise<void> {
    const args: string[] = [];
    if (options?.Force) {
      args.push(`--force`);
    }
    await this.depker.dax`${this.docker} rm ${args} ${name}`;
  }

  public async tag(source: string, target: string): Promise<void> {
    await this.depker.dax`${this.docker} tag ${source} ${target}`;
  }

  public async prune(): Promise<void> {
    await this.depker.dax`${this.docker} prune --force --all --filter until=24h`;
  }
}
