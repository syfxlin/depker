import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";
import { ServiceStatus } from "../entities/service.entity";
import { LogLevel } from "../types";

export class ListContainerRequest {
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

export type ListContainerResponse = {
  total: number;
  items: Array<{
    id: string;
    name: string;
    image: string;
    imageId: string;
    command: string;
    created: number;
    state: ServiceStatus;
    status: string;
    labels: Record<string, string>;
    networks: Array<{
      id: string;
      name: string;
      mac: string;
      ipv4: string;
      ipv6: string;
      aliases: string[];
    }>;
    ports: Array<{
      ip: string;
      hport: number;
      cport: number;
      type: string;
    }>;
    volumes: Array<{
      type: string;
      hpath: string;
      cpath: string;
      mode: string;
      readonly: boolean;
    }>;
  }>;
};

export class CreateContainerRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  commands: string;
}

export type CreateContainerResponse = {
  status: "success";
};

export class DeleteContainerRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type DeleteContainerResponse = {
  status: "success";
};

export class OperateContainerRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type OperateContainerResponse = {
  status: "success";
};

export class RenameContainerRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  rename: string;
}

export type RenameContainerResponse = {
  status: "success";
};

export class MetricsContainerRequest {
  name: string;
}

export type MetricsContainerData = {
  data: {
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
  error: string;
};

export class LogsContainerRequest {
  name: string;
  tail?: number;
}

export type LogsContainerData = {
  data: [LogLevel, number, string];
};

export class TerminalContainerRequest {
  name: string;
}

export type TerminalContainerData = {
  data: string;
};
