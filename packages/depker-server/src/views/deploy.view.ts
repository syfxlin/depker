import { DeployStatus, LogLevel } from "../types";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, Min } from "class-validator";

export class ListServiceDeployRequest {
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

export type ListServiceDeployResponse = {
  total: number;
  items: Array<{
    id: number;
    service: string;
    target: string;
    status: DeployStatus;
    createdAt: number;
    updatedAt: number;
  }>;
};

export class LogsServiceDeployRequest {
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

export type LogsServiceDeployResponse = {
  since: number;
  logs: Array<[LogLevel, number, string]>;
};

export class CancelServiceDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsInt()
  @Min(0)
  id: number;
}

export type CancelServiceDeployResponse = {
  status: "success";
};
