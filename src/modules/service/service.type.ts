import { PackContext } from "./pack.context.ts";

export interface Pack<C extends ServiceConfig = ServiceConfig> {
  init?: (ctx: PackContext<C>) => Promise<void> | void;
  build?: (ctx: PackContext<C>) => Promise<void> | void;
  destroy?: (ctx: PackContext<C>) => Promise<void> | void;
}

export interface BuildAtConfig {
  // basic
  name: string;

  // service
  file?: string;
  pull?: boolean;
  cache?: boolean;

  // values
  hosts?: Record<string, string>;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  build_args?: Record<string, string>;
}

export interface StartAtConfig {
  // basic
  name: string;

  // service
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
}

export interface DeployAtConfig extends BuildAtConfig, StartAtConfig {
  // basic
  name: string;
}

export interface ServiceConfig extends DeployAtConfig {
  // basic
  name: string;
  path?: string;
}
