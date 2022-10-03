import {
  IsBoolean,
  isBoolean,
  isFQDN,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
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
import { App } from "../entities/app.entity";
import { DepkerPluginOption } from "../plugins/plugin.types";
import { ObjectEach, objectEach } from "../validation/object-each.validation";
import { ArrayEach } from "../validation/array-each.validation";
import { RecordEach, recordEach } from "../validation/record-each.validation";

export class StatusAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;
}

export type StatusAppResponse = {
  status: "stopped" | "running" | "restarting" | "exited";
};

export class GetAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;
}

export type GetAppResponse = Omit<
  App,
  "buildpack" | "ports" | "volumes" | "deploys" | "hasId" | "save" | "remove" | "softRemove" | "reload" | "recover"
> & {
  buildpack: {
    name: string;
    values: Record<string, any>;
    options: DepkerPluginOption[];
  };
  ports: Array<{
    name: string;
    proto: "tcp" | "udp";
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

export class ListAppRequest {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number;
}

export type ListAppResponse = {
  total: number;
  items: Array<{
    name: string;
    buildpack: string;
    domain: string[];
    status: StatusAppResponse["status"];
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export class UpsertAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;

  @ObjectEach({
    name: [isString, isNotEmpty],
    values: [recordEach([isString, isNotEmpty])],
  })
  buildpack: {
    name: string;
    values: Record<string, any>;
  };

  @IsOptional()
  @ArrayEach([isString, isNotEmpty])
  commands?: string[];

  @IsOptional()
  @ArrayEach([isString, isNotEmpty])
  entrypoints?: string[];

  @IsOptional()
  @Matches(/^(no|always|on-failure|on-failure:\d+)$/)
  restart?: "no" | "always" | "on-failure" | `on-failure:${number}`;

  @IsOptional()
  @IsBoolean()
  pull?: boolean;

  // web
  @IsOptional()
  @ArrayEach([isString, isNotEmpty, isFQDN])
  domain?: string[];

  @IsOptional()
  @IsNotEmpty()
  rule?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsNotEmpty()
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
  @IsNotEmpty()
  user?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
  hosts: Array<{
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
}

export type UpsertAppResponse = GetAppResponse;

export class DeleteAppRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;
}

export type DeleteAppResponse = {
  status: "successful" | "failure";
};
