export type LocalConfig = {
  endpoint: string;
  token: string;
  HttpHeaders: Record<string, string>;
};

export type RemoteConfig = {
  mail: string;
  pass: string;
  ports?: string[];
  secrets?: Record<string, string>;
  options?: Record<string, string>;
  docker?: {
    socket?: string;
    host?: string;
    port?: string;
  };
  traefik?: {
    dashboard?: string;
    challenge?: string;
    envs?: Record<string, string>;
    labels?: Record<string, string>;
  };
  logrotate?: {
    trigger_interval?: string;
    trigger_size?: string;
    max_backups?: string;
    envs?: Record<string, string>;
    labels?: Record<string, string>;
  };
};

export type ProjectConfig = {
  // basic
  name: string;
  buildpack: string;
  pull?: boolean;
  restart?: "no" | "on-failure" | "always";
  commands?: string[];
  entrypoints?: string[];
  init?: boolean;
  remove?: boolean;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  ports?: Array<{
    hport: number;
    cport: number;
    proto?: "tcp" | "udp";
  }>;
  volumes?: Array<{
    hpath: string;
    cpath: string;
    readonly?: boolean;
  }>;

  // reserved
  image?: string; // for buildpack=image
  dockerfile?: string; // for buildpack=dockerfile
  build_args?: Record<string, string>; // for build_args

  // web
  domain?: string | string[];
  rule?: string;
  port?: number;
  scheme?: string;
  tls?: boolean;
  middlewares?: Array<{
    name: string;
    type: string;
    options?: Record<string, string>;
  }>;

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

  [key: string]: any;
};
