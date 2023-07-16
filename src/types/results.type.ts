import { CommandBuilder } from "../deps.ts";

// region common

export interface ContainerConfig {
  Hostname?: string;
  Domainname?: string;
  User?: string;
  AttachStdin?: boolean;
  AttachStdout?: boolean;
  AttachStderr?: boolean;
  ExposedPorts?: {
    [portAndProtocol: string]: {};
  };
  Tty?: boolean;
  OpenStdin?: boolean;
  StdinOnce?: boolean;
  Env?: string[];
  Cmd?: string[];
  Healthcheck?: {
    Test?: string[];
    Interval?: number;
    Timeout?: number;
    StartPeriod?: number;
    Retries?: number;
  };
  ArgsEscaped?: boolean;
  Image?: string;
  Volumes?: {
    [path: string]: {};
  };
  WorkingDir?: string;
  Entrypoint?: string | string[];
  NetworkDisabled?: boolean;
  MacAddress?: string;
  OnBuild?: string[];
  Labels?: {
    [key: string]: string;
  };
  StopSignal?: string;
  StopTimeout?: number;
  Shell?: string;
}

// endregion

// region containers

export interface ContainerInfo {
  Id: string;
  Name: string;
  Image: string;
  State: string;
  Status: string;
  Size: string;
  Created: string;
  Ports: string;
  Mounts: string;
  Labels: string;
  Networks: string;
}

export interface ContainerInspect {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
    Health?: {
      Status: string;
      FailingStreak: number;
      Log: Array<{
        Start: string;
        End: string;
        ExitCode: number;
        Output: string;
      }>;
    };
  };
  Image: string;
  ResolvConfPath: string;
  HostnamePath: string;
  HostsPath: string;
  LogPath: string;
  Name: string;
  RestartCount: number;
  Driver: string;
  Platform: string;
  MountLabel: string;
  ProcessLabel: string;
  AppArmorProfile: string;
  ExecIDs?: string[];
  HostConfig: {
    AutoRemove?: boolean;
    Binds?: string[];
    ContainerIDFile?: string;
    LogConfig?: {
      Type: string;
      Config: any;
    };
    NetworkMode?: string;
    PortBindings: {
      [portAndProtocol: string]: any[];
    };
    RestartPolicy?: {
      Name: string;
      MaximumRetryCount?: number;
    };
    VolumeDriver?: string;
    VolumesFrom?: any;
    CapAdd?: any;
    CapDrop?: any;
    CgroupnsMode: string;
    Dns?: any[];
    DnsOptions?: any[];
    DnsSearch?: string[];
    ExtraHosts?: any;
    GroupAdd?: string[];
    IpcMode?: string;
    Cgroup?: string;
    Links?: any;
    OomScoreAdj?: number;
    PidMode?: string;
    Privileged?: boolean;
    PublishAllPorts?: boolean;
    ReadonlyRootfs?: boolean;
    SecurityOpt?: any;
    UTSMode?: string;
    UsernsMode?: string;
    ShmSize?: number;
    Runtime?: string;
    ConsoleSize?: number[];
    Isolation?: string;
    CpuShares?: number;
    Memory?: number;
    NanoCpus?: number;
    CgroupParent?: string;
    BlkioWeight?: number;
    BlkioWeightDevice?: any;
    BlkioDeviceReadBps?: any;
    BlkioDeviceWriteBps?: any;
    BlkioDeviceReadIOps?: any;
    BlkioDeviceWriteIOps?: any;
    CpuPeriod?: number;
    CpuQuota?: number;
    CpusetCpus?: string;
    CpusetMems?: string;
    CpuRealtimePeriod?: number;
    CpuRealtimeRuntime?: number;
    Devices?: any;
    DeviceCgroupRules?: string[];
    DeviceRequests?: Array<{
      Driver?: string;
      Count?: number;
      DeviceIDs?: string[];
      Capabilities?: string[][];
      Options?: { [key: string]: string };
    }>;
    KernelMemory?: number;
    KernelMemoryTCP?: number;
    MemoryReservation?: number;
    MemorySwap?: number;
    MemorySwappiness?: number;
    OomKillDisable?: boolean;
    PidsLimit?: number;
    Ulimits?: any;
    CpuCount?: number;
    CpuPercent?: number;
    IOMaximumIOps?: number;
    IOMaximumBandwidth?: number;
    MaskedPaths?: string[];
    ReadonlyPaths?: string[];
  };
  GraphDriver: {
    Name: string;
    Data: {
      DeviceId: string;
      DeviceName: string;
      DeviceSize: string;
    };
  };
  Mounts: Array<{
    Name?: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Propagation: string;
  }>;
  Config: {
    Hostname: string;
    Domainname: string;
    User: string;
    AttachStdin: boolean;
    AttachStdout: boolean;
    AttachStderr: boolean;
    ExposedPorts: { [portAndProtocol: string]: {} };
    Tty: boolean;
    OpenStdin: boolean;
    StdinOnce: boolean;
    Env: string[];
    Cmd: string[];
    Image: string;
    Volumes: { [volume: string]: {} };
    WorkingDir: string;
    Entrypoint?: string | string[];
    OnBuild?: any;
    Labels: { [label: string]: string };
  };
  NetworkSettings: {
    Bridge: string;
    SandboxID: string;
    HairpinMode: boolean;
    LinkLocalIPv6Address: string;
    LinkLocalIPv6PrefixLen: number;
    Ports: {
      [portAndProtocol: string]: Array<{
        HostIp: string;
        HostPort: string;
      }>;
    };
    SandboxKey: string;
    SecondaryIPAddresses?: any;
    SecondaryIPv6Addresses?: any;
    EndpointID: string;
    Gateway: string;
    GlobalIPv6Address: string;
    GlobalIPv6PrefixLen: number;
    IPAddress: string;
    IPPrefixLen: number;
    IPv6Gateway: string;
    MacAddress: string;
    Networks: {
      [type: string]: {
        IPAMConfig?: any;
        Links?: any;
        Aliases?: any;
        NetworkID: string;
        EndpointID: string;
        Gateway: string;
        IPAddress: string;
        IPPrefixLen: number;
        IPv6Gateway: string;
        GlobalIPv6Address: string;
        GlobalIPv6PrefixLen: number;
        MacAddress: string;
      };
    };
    Node?: {
      ID: string;
      IP: string;
      Addr: string;
      Name: string;
      Cpus: number;
      Memory: number;
      Labels: any;
    };
  };
}

export interface ContainerStartOptions {
  Attach?: boolean;
  DetachKeys?: string;
  Interactive?: boolean;
}

export interface ContainerStopOptions {
  Time?: string;
  Signal?: string;
}

export interface ContainerRestartOptions {
  Time?: string;
  Signal?: string;
}

export interface ContainerKillOptions {
  Signal?: string;
}

export interface ContainerRemoveOptions {
  Force?: boolean;
  Link?: boolean;
  Volumes?: boolean;
}

export interface ContainerCreateOptions {
  Commands?: string[];
  EntryPoints?: string[];
  Pull?: "never" | "missing" | "always";
  Restart?: "no" | "on-failure" | "always";
  Init?: boolean;
  Remove?: boolean;
  Envs?: Record<string, string>;
  EnvFiles?: string[];
  Labels?: Record<string, string>;
  LabelFiles?: string[];
  Ports?: string[];
  Volumes?: string[];
  // healthcheck
  Healthcheck?: {
    Test: string[];
    Period?: string;
    Interval?: string;
    Retries?: string;
    Timeout?: string;
  };
  // networks
  Mac?: string;
  Dns?: string[];
  IPv4?: string;
  IPv6?: string;
  Host?: string;
  Hosts?: Record<string, string>;
  Network?: string;
  Networks?: string[];
  // resources
  Cpu?: string;
  Memory?: string;
  OOMKill?: boolean;
  // privilege
  Privileged?: boolean;
  CapAdds?: string[];
  CapDrops?: string[];
  // runtime
  User?: string;
  Workdir?: string;
  Groups?: string[];
  // extension
  Flags?: string[];
}

export interface ContainerRunOptions extends ContainerCreateOptions {
  Tty?: boolean;
  Detach?: boolean;
  DetachKeys?: string;
  Interactive?: boolean;
}

export interface ContainerExecOptions {
  Tty?: boolean;
  Detach?: boolean;
  DetachKeys?: string;
  Interactive?: boolean;
  Privileged?: boolean;
  User?: string;
  Workdir?: string;
  Envs?: Record<string, string>;
  EnvFiles?: string[];
}

export interface ContainerLogsOptions {
  Details?: boolean;
  Follow?: boolean;
  Timestamps?: boolean;
  Tail?: string;
  Since?: string;
  Until?: string;
}

export interface ContainerTopOptions {
  Options?: string;
}

export interface ContainerStatsOptions {
  All?: boolean;
  Format?: string;
  Stream?: boolean;
  NoTrunc?: boolean;
}

export interface ContainerCopyOptions {
  Archive?: boolean;
  FollowLink?: boolean;
}

// endregion

// region images

export interface ImageInfo {
  Id: string;
  Repository: string;
  Tag: string;
  Digest: string;
  Created: string;
  CreatedSince: string;
  Size: string;
  VirtualSize: string;
}

export interface ImageInspect {
  Id: string;
  RepoTags: string[];
  RepoDigests: string[];
  Parent: string;
  Comment: string;
  Created: string;
  Container: string;
  ContainerConfig: ContainerConfig;
  DockerVersion: string;
  Author: string;
  Config: ContainerConfig;
  Architecture: string;
  Os: string;
  Size: number;
  VirtualSize: number;
  GraphDriver: {
    Name: string;
    Data: {
      DeviceId: string;
      DeviceName: string;
      DeviceSize: string;
    };
  };
  RootFS: {
    Type: string;
    Layers?: string[];
    BaseLayer?: string;
  };
  Metadata: {
    LastTagTime: string;
  };
}

export interface ImagePullOptions {
  AllTags?: boolean;
  Platform?: string;
}

export interface ImagePushOptions {
  AllTags?: boolean;
}

export interface BuilderBuildOptions {
  File?: string;
  Pull?: boolean;
  Cache?: boolean;
  Remove?: boolean;
  // values
  Args?: Record<string, string>;
  Labels?: Record<string, string>;
  Secrets?: Record<string, string>;
  // networks
  Hosts?: Record<string, string>;
  Networks?: string[];
  // extensions
  Flags?: string[];
}

export interface ImageRemoveOptions {
  Force?: boolean;
}

// endregion

// region volumes

export interface VolumeInfo {
  Name: string;
  Scope: string;
  Driver: string;
  Size: string;
  Links: string;
  Mountpoint: string;
}

export interface VolumeInspect {
  Name: string;
  Scope: string;
  Driver: string;
  Created: string;
  Mountpoint: string;
  Labels: {
    [key: string]: string;
  };
  Options: {
    [key: string]: string;
  };
}

export interface VolumeCreateOptions {
  Driver: string;
  Labels: Record<string, string>;
  Options: Record<string, string>;
}

export interface VolumeRemoveOptions {
  Force?: string;
}

// endregion

// region network

export interface NetworkInfo {
  Id: string;
  Name: string;
  Scope: string;
  Driver: string;
  IPv6: boolean;
  Internal: boolean;
  Created: string;
}

export interface NetworkInspect {
  Id: string;
  Name: string;
  Created: string;
  Scope: string;
  Driver: string;
  EnableIPv6: boolean;
  IPAM?: {
    Driver: string;
    Options?: {
      [key: string]: string;
    };
    Config?: Array<{
      Subnet?: string;
      IPRange?: string;
      Gateway?: string;
      AuxAddress?: {
        [key: string]: string;
      };
    }>;
  };
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  ConfigFrom?: {
    Network: string;
  };
  ConfigOnly: boolean;
  Containers?: {
    [id: string]: {
      Name: string;
      EndpointID: string;
      MacAddress: string;
      IPv4Address: string;
      IPv6Address: string;
    };
  };
  Options?: {
    [key: string]: string;
  };
  Labels?: {
    [key: string]: string;
  };
}

export interface NetworkCreateOptions {
  Driver?: string;
  Gateway?: string;
  Subnet?: string;
  IPRange?: string;
  EnableIPv6?: boolean;
  Scope?: string;
  Internal?: boolean;
  Labels?: Record<string, string>;
  Options?: Record<string, string>;
}

export interface NetworkRemoveOptions {
  Force?: boolean;
}

export interface NetworkConnectOptions {
  IPv4?: string;
  IPv6?: string;
  Alias?: string[];
}

export interface NetworkDisconnectOptions {
  Force?: boolean;
}

// endregion

// region operation

export interface ContainerOperation {
  list(): Promise<Array<ContainerInfo>>;
  find(name: string): Promise<ContainerInfo | undefined>;
  inspect(name: string[]): Promise<Array<ContainerInspect>>;
  start(name: string[], options?: ContainerStartOptions): Promise<void>;
  stop(name: string[], options?: ContainerStopOptions): Promise<void>;
  restart(name: string[], options?: ContainerRestartOptions): Promise<void>;
  kill(name: string[], options?: ContainerKillOptions): Promise<void>;
  remove(name: string[], options?: ContainerRemoveOptions): Promise<void>;
  rename(name: string, rename: string): Promise<void>;
  prune(): Promise<void>;
  create(name: string, target: string, options?: ContainerCreateOptions): CommandBuilder;
  run(name: string, target: string, options?: ContainerRunOptions): CommandBuilder;
  exec(name: string, commands: string[], options?: ContainerExecOptions): CommandBuilder;
  logs(name: string, options?: ContainerLogsOptions): CommandBuilder;
  top(name: string, options?: ContainerTopOptions): CommandBuilder;
  stats(name: string, options?: ContainerStatsOptions): CommandBuilder;
  copy(source: string, target: string, options?: ContainerCopyOptions): CommandBuilder;
  wait(name: string[]): Promise<void>;
}

export interface ImageOperation {
  list(): Promise<Array<ImageInfo>>;
  find(name: string): Promise<ImageInfo | undefined>;
  inspect(name: string[]): Promise<Array<ImageInspect>>;
  tag(source: string, target: string): Promise<void>;
  pull(name: string, options?: ImagePullOptions): CommandBuilder;
  push(name: string, options?: ImagePushOptions): CommandBuilder;
  remove(name: string[], options?: ImageRemoveOptions): Promise<void>;
  prune(): Promise<void>;
}

export interface VolumeOperation {
  list(): Promise<Array<VolumeInfo>>;
  find(name: string): Promise<VolumeInfo | undefined>;
  inspect(name: string[]): Promise<Array<VolumeInspect>>;
  create(name: string, options?: VolumeCreateOptions): Promise<void>;
  remove(name: string[], options?: VolumeRemoveOptions): Promise<void>;
  prune(): Promise<void>;
}

export interface NetworkOperation {
  default(): Promise<string>;
  list(): Promise<Array<NetworkInfo>>;
  find(name: string): Promise<NetworkInfo | undefined>;
  inspect(name: string[]): Promise<Array<NetworkInspect>>;
  create(name: string, options?: NetworkCreateOptions): Promise<void>;
  remove(name: string[], options?: NetworkRemoveOptions): Promise<void>;
  prune(): Promise<void>;
  connect(name: string, container: string, options?: NetworkConnectOptions): Promise<void>;
  disconnect(name: string, container: string, options?: NetworkDisconnectOptions): Promise<void>;
}

export interface BuilderOperation {
  build(name: string, target: string, options?: BuilderBuildOptions): CommandBuilder;
  save(name: string): Deno.Command;
  load(): Deno.Command;
}

// endregion

// region parser

export const networks = {
  info: (data: Record<string, any>): NetworkInfo => ({
    Id: data.ID,
    Name: data.Name,
    Scope: data.Scope,
    Driver: data.Driver,
    IPv6: data.IPv6 === "true",
    Internal: data.Internal === "true",
    Created: new Date(data.CreatedAt).toISOString(),
  }),
  inspect: (data: Record<string, any>): NetworkInspect => ({
    Id: data.Id,
    Name: data.Name,
    Created: new Date(data.Created).toISOString(),
    Scope: data.Scope,
    Driver: data.Driver,
    EnableIPv6: data.EnableIPv6,
    IPAM: data.IPAM,
    Internal: data.Internal,
    Attachable: data.Attachable,
    Ingress: data.Ingress,
    ConfigFrom: data.ConfigFrom,
    ConfigOnly: data.ConfigOnly,
    Containers: data.Containers,
    Options: data.Options,
    Labels: data.Labels,
  }),
};

export const volumes = {
  info: (data: Record<string, any>): VolumeInfo => ({
    Name: data.Name,
    Scope: data.Scope,
    Driver: data.Driver,
    Size: data.Size,
    Links: data.Links,
    Mountpoint: data.Mountpoint,
  }),
  inspect: (data: Record<string, any>): VolumeInspect => ({
    Name: data.Name,
    Scope: data.Scope,
    Driver: data.Driver,
    Created: new Date(data.CreatedAt).toISOString(),
    Mountpoint: data.Mountpoint,
    Labels: data.Labels,
    Options: data.Options,
  }),
};

export const images = {
  info: (data: Record<string, any>): ImageInfo => ({
    Id: data.ID,
    Repository: data.Repository,
    Tag: data.Tag,
    Digest: data.Digest,
    Created: new Date(data.CreatedAt).toISOString(),
    CreatedSince: data.CreatedSince,
    Size: data.Size,
    VirtualSize: data.VirtualSize,
  }),
  inspect: (data: Record<string, any>): ImageInspect => ({
    Id: data.Id,
    RepoTags: data.RepoTags,
    RepoDigests: data.RepoDigests,
    Parent: data.Parent,
    Comment: data.Comment,
    Created: new Date(data.Created).toISOString(),
    Container: data.Container,
    ContainerConfig: data.ContainerConfig,
    DockerVersion: data.DockerVersion,
    Author: data.Author,
    Config: data.Config,
    Architecture: data.Architecture,
    Os: data.Os,
    Size: data.Size,
    VirtualSize: data.VirtualSize,
    GraphDriver: data.GraphDriver,
    RootFS: data.RootFS,
    Metadata: data.Metadata,
  }),
};

export const containers = {
  // prettier-ignore
  info: (data: Record<string, any>): ContainerInfo => ({
    Id: data.ID,
    Name: data.Names,
    Image: data.Image,
    State: data.State,
    Status: data.Status,
    Size: data.Size,
    Created: new Date(data.CreatedAt).toISOString(),
    Ports: data.Ports,
    Mounts: data.Mounts,
    Labels: data.Labels,
    Networks: data.Networks,
  }),
  inspect: (data: Record<string, any>): ContainerInspect => ({
    Id: data.Id,
    Created: new Date(data.Created).toISOString(),
    Path: data.Path,
    Args: data.Args,
    State: data.State,
    Image: data.Image,
    ResolvConfPath: data.ResolvConfPath,
    HostnamePath: data.HostnamePath,
    HostsPath: data.HostsPath,
    LogPath: data.LogPath,
    Name: data.Name.substring(1),
    RestartCount: data.RestartCount,
    Driver: data.Driver,
    Platform: data.Platform,
    MountLabel: data.MountLabel,
    ProcessLabel: data.ProcessLabel,
    AppArmorProfile: data.AppArmorProfile,
    ExecIDs: data.ExecIDs,
    HostConfig: data.HostConfig,
    GraphDriver: data.GraphDriver,
    Mounts: data.Mounts,
    Config: data.Config,
    NetworkSettings: data.NetworkSettings,
  }),
};

// endregion
