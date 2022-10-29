import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from "class-validator";
import { DeployStatus, DeployTrigger } from "../entities/deploy.entity";
import { LogLevel } from "../entities/log.entity";
import { SuccessResponse } from "./common.view";

export class ListDeployRequest {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  app?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  commit?: string;

  @IsString()
  @IsOptional()
  @IsIn(["queued", "running", "failed", "success"])
  status?: DeployStatus;

  @IsString()
  @IsOptional()
  @IsIn(["manual", "depker", "git"])
  trigger?: DeployTrigger;

  @IsBoolean()
  @IsOptional()
  force?: boolean;

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

export type ListDeployResponse = {
  total: number;
  items: Array<GetDeployResponse>;
};

export class GetDeployRequest {
  @IsInt()
  @Min(0)
  id: number;
}

export type GetDeployResponse = {
  id: number;
  app: string;
  commit: string;
  status: DeployStatus;
  trigger: DeployTrigger;
  force: boolean;
  createdAt: number;
  updatedAt: number;
};

export class DispatchDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  app: string;

  @IsString()
  @IsNotEmpty()
  ref: string;

  @IsOptional()
  @IsString()
  @IsIn(["manual", "depker", "git"])
  trigger?: DeployTrigger;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export type DispatchDeployResponse = GetDeployResponse;

export class CancelDeployRequest {
  @IsInt()
  @Min(0)
  id: number;
}

export type CancelDeployResponse = SuccessResponse;

export class LogsDeployRequest {
  @IsInt()
  @Min(0)
  id: number;

  @IsNumber()
  @IsOptional()
  since?: number;

  @IsNumber()
  @IsOptional()
  until?: number;

  @IsInt()
  @IsOptional()
  tail?: number;
}

export type LogsDeployResponse = {
  status: DeployStatus;
  logs: Array<[number, LogLevel, string]>;
};
