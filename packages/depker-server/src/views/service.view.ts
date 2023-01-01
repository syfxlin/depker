import {
  isBoolean,
  IsBoolean,
  isFQDN,
  IsIn,
  isIn,
  IsInt,
  isNotEmpty,
  IsNotEmpty,
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
  ServiceHealthCheck,
  ServiceHost,
  ServiceLabel,
  ServiceMiddleware,
  ServicePort,
  ServiceRestart,
  ServiceSecret,
  ServiceStatus,
  ServiceType,
  ServiceVolume,
} from "../entities/service.entity";
import { ArrayEach } from "../validation/array-each.validation";
import { objectEach } from "../validation/object-each.validation";
import { RecordEach, recordEach } from "../validation/record-each.validation";
import { DeployStatus } from "../types";

export class ListServiceRequest {
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

export type ListServiceResponse = {
  total: number;
  items: Array<{
    name: string;
    type: ServiceType;
    buildpack: string;
    icon: string;
    domain: string;
    status: ServiceStatus;
    createdAt: number;
    updatedAt: number;
    deploydAt: number;
  }>;
};

export class UpsertServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(["app", "job"])
  type: ServiceType;

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
  restart?: ServiceRestart;

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
  middlewares?: Array<ServiceMiddleware>;

  // healthcheck
  @IsOptional()
  @IsObject()
  healthcheck?: ServiceHealthCheck;

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
  labels?: Array<ServiceLabel>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  secrets?: Array<ServiceSecret>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  hosts?: Array<ServiceHost>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      hport: [isNumber, (v) => v >= 1 && v <= 65535],
      cport: [isNumber, (v) => v >= 1 && v <= 65535],
      proto: [isString, (v) => isIn(v, ["tcp", "udp"])],
    }),
  ])
  ports?: Array<ServicePort>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      hpath: [isString, isNotEmpty],
      cpath: [isString, isNotEmpty],
      readonly: [isBoolean],
    }),
  ])
  volumes?: Array<ServiceVolume>;

  @IsOptional()
  @RecordEach([isString, isNotEmpty])
  extensions?: Record<string, any>;
}

export type UpsertServiceResponse = GetServiceResponse;

export class GetServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type GetServiceResponse = {
  name: string;
  type: ServiceType;
  buildpack: string;
  commands: string[];
  entrypoints: string[];
  restart: ServiceRestart;
  pull: boolean;
  domain: string[];
  rule: string;
  port: number;
  scheme: string;
  tls: boolean;
  middlewares: Array<ServiceMiddleware>;
  healthcheck: ServiceHealthCheck;
  init: boolean;
  rm: boolean;
  privileged: boolean;
  user: string;
  workdir: string;
  buildArgs: Record<string, string>;
  networks: Record<string, string>;
  labels: Array<ServiceLabel>;
  secrets: Array<ServiceSecret>;
  hosts: Array<ServiceHost>;
  ports: Array<ServicePort>;
  volumes: Array<ServiceVolume>;
  createdAt: number;
  updatedAt: number;
  extensions: Record<string, any>;
};

export class DeleteServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeleteServiceResponse = {
  status: "success";
};

export class StatusServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type StatusServiceResponse = {
  status: ServiceStatus;
};

export class MetricsServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type MetricsServiceResponse = {
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
  process: {
    titles: string[];
    processes: string[][];
  };
};

export class HistoryServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  limit?: number;
}

export type HistoryServiceResponse = {
  total: number;
  items: Array<{
    message: string;
    body: string;
    commit: string;
    refs: string[];
    author: string;
    email: string;
    time: number;
  }>;
};

export class UpServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type UpServiceResponse = {
  id: number;
  service: string;
  target: string;
  status: DeployStatus;
  createdAt: number;
  updatedAt: number;
};

export class DownServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DownServiceResponse = {
  status: "success";
};

export class RestartServiceRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type RestartServiceResponse = {
  status: "success";
};
