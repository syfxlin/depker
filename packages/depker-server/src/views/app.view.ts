import {
  isBoolean,
  IsBoolean,
  isFQDN,
  IsIn,
  IsInt,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  isNumber,
  IsObject,
  IsOptional,
  isString,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import {
  AppHealthCheck,
  AppHost,
  AppLabel,
  AppMiddleware,
  AppRestart,
  AppSecret,
  AppStatus,
} from "../entities/app.entity";
import { PortProtocol } from "../entities/port.entity";
import { ArrayEach } from "../validation/array-each.validation";
import { objectEach } from "../validation/object-each.validation";
import { RecordEach, recordEach } from "../validation/record-each.validation";
import { DeployStatus, DeployTrigger } from "../entities/deploy.entity";
import { LogLevel } from "../entities/log.entity";

/*
GET    /apps
POST   /apps
GET    /apps/:name
DELETE /apps/:name

GET    /apps/:name/status
GET    /apps/:name/metrics
GET    /apps/:name/logs

POST   /apps/:name/up
POST   /apps/:name/down
POST   /apps/:name/restart

// list deploy
GET    /apps/:name/deploy
// get deploy logs
GET    /apps/:name/deploy/:id/logs
// cancel deploy
POST   /apps/:name/deploy/:id/cancel
 */

export class ListAppRequest {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  limit?: number;

  @IsString()
  @IsOptional()
  @Matches(/\w+:(asc|desc)/)
  sort?: string;
}

export type ListAppResponse = {
  total: number;
  items: Array<{
    name: string;
    buildpack: string;
    icon: string;
    domain: string;
    status: AppStatus;
    createdAt: number;
    updatedAt: number;
    deploydAt: number;
  }>;
};

export class UpsertAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  buildpack: string;

  @IsOptional()
  @ArrayEach([isString, isNotEmpty])
  commands?: string[];

  @IsOptional()
  @ArrayEach([isString, isNotEmpty])
  entrypoints?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^(no|always|on-failure)$/)
  restart?: AppRestart;

  @IsOptional()
  @IsBoolean()
  pull?: boolean;

  // web
  @IsOptional()
  @ArrayEach([isString, isNotEmpty, isFQDN])
  domain?: string[];

  @IsOptional()
  @IsString()
  rule?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  scheme?: string;

  @IsOptional()
  @IsBoolean()
  tls?: boolean;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      type: [isString, isNotEmpty],
      options: [recordEach([isString, isNotEmpty], [isString])],
    }),
  ])
  middlewares?: Array<AppMiddleware>;

  // healthcheck
  @IsOptional()
  @IsObject()
  healthcheck?: AppHealthCheck;

  // extensions
  @IsOptional()
  @IsBoolean()
  init?: boolean;

  @IsOptional()
  @IsBoolean()
  rm?: boolean;

  @IsOptional()
  @IsBoolean()
  privileged?: boolean;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  workdir?: string;

  // values
  @IsOptional()
  @RecordEach([isString, isNotEmpty], [isString])
  buildArgs?: Record<string, string>;

  @IsOptional()
  @RecordEach([isString, isNotEmpty], [isString])
  networks?: Record<string, string>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  labels?: Array<AppLabel>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  secrets?: Array<AppSecret>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  hosts?: Array<AppHost>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      port: [isNumber, (v) => v >= 1 && v <= 65535],
    }),
  ])
  ports?: Array<{
    name: string;
    port: number;
  }>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      path: [isString],
      readonly: [isBoolean],
    }),
  ])
  volumes?: Array<{
    name: string;
    path: string;
    readonly: boolean;
  }>;

  @IsOptional()
  @RecordEach([isString, isNotEmpty])
  extensions?: Record<string, any>;
}

export type UpsertAppResponse = GetAppResponse;

export class GetAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type GetAppResponse = {
  name: string;
  buildpack: string;
  commands: string[];
  entrypoints: string[];
  restart: AppRestart;
  pull: boolean;
  domain: string[];
  rule: string;
  port: number;
  scheme: string;
  tls: boolean;
  middlewares: Array<AppMiddleware>;
  healthcheck: AppHealthCheck;
  init: boolean;
  rm: boolean;
  privileged: boolean;
  user: string;
  workdir: string;
  buildArgs: Record<string, string>;
  networks: Record<string, string>;
  labels: Array<AppLabel>;
  secrets: Array<AppSecret>;
  hosts: Array<AppHost>;
  createdAt: number;
  updatedAt: number;
  extensions: Record<string, any>;
  ports: Array<{
    name: string;
    proto: PortProtocol;
    hport: number;
    cport: number;
  }>;
  volumes: Array<{
    name: string;
    global: boolean;
    hpath: string;
    cpath: string;
    readonly: boolean;
  }>;
};

export class DeleteAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeleteAppResponse = {
  status: "success";
};

export class StatusAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type StatusAppResponse = {
  status: AppStatus;
};

export class MetricsAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type MetricsAppResponse = {
  cpu: {
    free: number;
    used: number;
    total: number;
  };
  memory: {
    free: number;
    used: number;
    total: number;
  };
  network: {
    input: number;
    output: number;
  };
};

export class LogsAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsNumber()
  @IsOptional()
  since?: number;

  @IsInt()
  @IsOptional()
  tail?: number;
}

export type LogsAppResponse = {
  logs: Array<[LogLevel, number, string]>;
  since: number;
};

export class UpAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(["manual", "depker", "git"])
  trigger?: DeployTrigger;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export type UpAppResponse = {
  id: number;
  app: string;
  commit: string;
  status: DeployStatus;
  trigger: DeployTrigger;
  force: boolean;
  createdAt: number;
  updatedAt: number;
};

export class DownAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DownAppResponse = {
  status: "success";
};

export class RestartAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type RestartAppResponse = {
  status: "success";
};

export class ListAppDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  limit?: number;

  @IsString()
  @IsOptional()
  @Matches(/\w+:(asc|desc)/)
  sort?: string;
}

export type ListAppDeployResponse = {
  total: number;
  items: Array<{
    id: number;
    app: string;
    commit: string;
    status: DeployStatus;
    trigger: DeployTrigger;
    force: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
};

export class LogsAppDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsInt()
  @Min(0)
  id: number;

  @IsNumber()
  @IsOptional()
  since?: number;

  @IsInt()
  @IsOptional()
  tail?: number;
}

export type LogsAppDeployResponse = {
  since: number;
  logs: Array<[LogLevel, number, string]>;
};

export class CancelAppDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsInt()
  @Min(0)
  id: number;
}

export type CancelAppDeployResponse = {
  status: "success";
};
