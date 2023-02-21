export type ContainerInfo = {
  ID: string;
  Name: string;
  Image: string;
  State: string;
  Status: string;
  Size: string;
  CreatedAt: string;
};

export type ContainerInspect = {
  ID: string;
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
    Health?:
      | {
          Status: string;
          FailingStreak: number;
          Log: Array<{
            Start: string;
            End: string;
            ExitCode: number;
            Output: string;
          }>;
        }
      | undefined
      | null;
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
  ExecIDs?: string[] | undefined | null;
  HostConfig: {
    AutoRemove?: boolean | undefined | null;
    Binds?: string[] | undefined | null;
    ContainerIDFile?: string | undefined | null;
    LogConfig?:
      | {
          Type: string;
          Config: any;
        }
      | undefined
      | null;
    NetworkMode?: string | undefined | null;
    PortBindings: {
      [portAndProtocol: string]: any[];
    };
    RestartPolicy?:
      | {
          Name: string;
          MaximumRetryCount?: number | undefined;
        }
      | undefined;
    VolumeDriver?: string | undefined;
    VolumesFrom?: any;
    CapAdd?: any;
    CapDrop?: any;
    CgroupnsMode: string;
    Dns?: any[] | undefined;
    DnsOptions?: any[] | undefined;
    DnsSearch?: string[] | undefined;
    ExtraHosts?: any;
    GroupAdd?: string[] | undefined;
    IpcMode?: string | undefined;
    Cgroup?: string | undefined;
    Links?: any;
    OomScoreAdj?: number | undefined;
    PidMode?: string | undefined;
    Privileged?: boolean | undefined;
    PublishAllPorts?: boolean | undefined;
    ReadonlyRootfs?: boolean | undefined;
    SecurityOpt?: any;
    UTSMode?: string | undefined;
    UsernsMode?: string | undefined;
    ShmSize?: number | undefined;
    Runtime?: string | undefined;
    ConsoleSize?: number[] | undefined;
    Isolation?: string | undefined;
    CpuShares?: number | undefined;
    Memory?: number | undefined;
    NanoCpus?: number | undefined;
    CgroupParent?: string | undefined;
    BlkioWeight?: number | undefined;
    BlkioWeightDevice?: any;
    BlkioDeviceReadBps?: any;
    BlkioDeviceWriteBps?: any;
    BlkioDeviceReadIOps?: any;
    BlkioDeviceWriteIOps?: any;
    CpuPeriod?: number | undefined;
    CpuQuota?: number | undefined;
    CpusetCpus?: string | undefined;
    CpusetMems?: string | undefined;
    CpuRealtimePeriod?: number | undefined;
    CpuRealtimeRuntime?: number | undefined;
    Devices?: any;
    DeviceCgroupRules?: string[] | undefined;
    DeviceRequests?:
      | Array<{
          Driver?: string | undefined;
          Count?: number | undefined;
          DeviceIDs?: string[] | undefined;
          Capabilities?: string[][] | undefined;
          Options?: { [key: string]: string } | undefined;
        }>
      | undefined;
    KernelMemory?: number | undefined;
    KernelMemoryTCP?: number | undefined;
    MemoryReservation?: number | undefined;
    MemorySwap?: number | undefined;
    MemorySwappiness?: number | undefined;
    OomKillDisable?: boolean | undefined;
    PidsLimit?: number | undefined;
    Ulimits?: any;
    CpuCount?: number | undefined;
    CpuPercent?: number | undefined;
    IOMaximumIOps?: number | undefined;
    IOMaximumBandwidth?: number | undefined;
    MaskedPaths?: string[] | undefined;
    ReadonlyPaths?: string[] | undefined;
  };
  GraphDriver: {
    Name: string;
    Data: {
      LowerDir: string;
      MergedDir: string;
      UpperDir: string;
      WorkDir: string;
    };
  };
  Mounts: Array<{
    Type: string;
    Name?: string | undefined | null;
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
    ExposedPorts: {
      [portAndProtocol: string]: object;
    };
    Tty: boolean;
    OpenStdin: boolean;
    StdinOnce: boolean;
    Env: string[];
    Cmd: string[];
    Image: string;
    Volumes?: { [volume: string]: object } | undefined | null;
    WorkingDir: string;
    Entrypoint?: string | string[] | undefined;
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
        DriverOpts: any;
      };
    };
  };
};

export type ImageInfo = {
  ID: string;
  Repository: string;
  Tag: string;
  Size: string;
  VirtualSize: string;
  CreatedAt: string;
  CreatedSince: string;
};

export type NetworkInfo = {
  ID: string;
  Name: string;
  Driver: string;
  Scope: string;
  IPv6: boolean;
  CreatedAt: Date;
};

export type VolumeInfo = {
  Name: string;
  Driver: string;
  Scope: string;
  Mountpoint: string;
};

export type VolumeInspect = {
  Name: string;
  Driver: string;
  Scope: string;
  Mountpoint: string;
  Labels: Record<string, string> | undefined | null;
  Options: any;
  CreatedAt: string;
};

export type ContainerCreateOptions = {
  // basic
  commands?: string[];
  entrypoints?: string[];
  pull?: "never" | "missing" | "always";
  restart?: "no" | "on-failure" | "always";
  init?: boolean;
  remove?: boolean;
  envs?: Record<string, string>;
  env_files?: string[];
  labels?: Record<string, string>;
  label_files?: string[];
  ports?: string[];
  volumes?: string[];

  // healthcheck
  healthcheck?: {
    commands: string[];
    period?: string;
    interval?: string;
    retries?: string;
    timeout?: string;
  };

  // networks
  mac?: string;
  dns?: string[];
  ipv4?: string;
  ipv6?: string;
  host?: string;
  hosts?: Record<string, string>;
  networks?: string[];

  // resources
  cpu?: string;
  memory?: string;
  oom_kill?: boolean;

  // privilege
  privileged?: boolean;
  cap_adds?: string[];
  cap_drops?: string[];

  // runtime
  user?: string;
  workdir?: string;
  groups?: string[];

  // extensions
  flags?: string[];
};

export type ContainerRunOptions = ContainerCreateOptions & {
  detach?: boolean;
};

export type ContainerExecOptions = {
  tty?: boolean;
  detach?: boolean;
  interactive?: boolean;
  privileged?: boolean;
  user?: string;
  workdir?: string;
  envs?: Record<string, string>;
  env_files?: string[];
};

export type ContainerBuildOptions = {
  file?: string;
  pull?: boolean;
  remove?: boolean;
  // values
  args?: Record<string, string>;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  // networks
  hosts?: Record<string, string>;
  networks?: string[];
  // extensions
  flags?: string[];
};

export type ContainerLogsOptions = {
  follow?: boolean;
  timestamps?: boolean;
  tail?: string;
  since?: string;
  until?: string;
};
