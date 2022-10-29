import {
  IsBoolean,
  isBoolean,
  isFQDN,
  IsInt,
  isNotEmpty,
  IsNotEmpty,
  isNumber,
  IsObject,
  IsOptional,
  IsString,
  isString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import { objectEach } from "../validation/object-each.validation";
import { ArrayEach } from "../validation/array-each.validation";
import { RecordEach, recordEach } from "../validation/record-each.validation";
import { AppRestart, AppStatus } from "../entities/app.entity";
import { PortProtocol } from "../entities/port.entity";
import { SuccessResponse } from "./common.view";

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
  middlewares: Array<{
    name: string;
    type: string;
    options: Record<string, string>;
  }>;
  healthcheck: {
    cmd?: string[];
    retries?: number;
    interval?: number;
    start?: number;
    timeout?: number;
  };
  init: boolean;
  rm: boolean;
  privileged: boolean;
  user: string;
  workdir: string;
  buildArgs: Record<string, string>;
  networks: Record<string, string>;
  labels: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;
  secrets: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;
  hosts: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;
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
  createdAt: number;
  updatedAt: number;
};

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
    status: StatusAppResponse["status"];
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
  middlewares?: Array<{
    name: string;
    type: string;
    options: Record<string, string>;
  }>;

  // healthcheck
  @IsOptional()
  @IsObject()
  healthcheck?: {
    cmd?: string[];
    retries?: number;
    interval?: number;
    start?: number;
    timeout?: number;
  };

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
  labels?: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  secrets?: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;

  @IsOptional()
  @ArrayEach([
    objectEach({
      name: [isString, isNotEmpty],
      value: [isString],
      onbuild: [isBoolean],
    }),
  ])
  hosts?: Array<{
    name: string;
    value: string;
    onbuild: boolean;
  }>;

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

export class DeleteAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeleteAppResponse = SuccessResponse;

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
