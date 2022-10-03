import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export type VersionResponse = {
  name: string;
  description: string;
  version: string;
};

export type MetricsResponse = {
  time: {
    current: number;
    timezone: string;
    uptime: number;
  };
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
  swap: {
    free: number;
    used: number;
    total: number;
  };
  disk: Array<{
    name: string;
    type: string;
    free: number;
    used: number;
    total: number;
  }>;
  traefik: {
    reload: {
      last_success: number;
      last_failure: number;
      total_success: number;
      total_failure: number;
    };
    connections: {
      [entrypoint: string]: number;
    };
    requests: {
      [code: string]: number;
    };
    certs: {
      [cert: string]: number;
    };
  };
};

export class LogsRequest {
  @IsOptional()
  @IsNumber()
  @Min(0)
  lines: number = 1000;

  @IsOptional()
  @IsBoolean()
  download: boolean = false;
}

export type LogsResponse = Array<string>;
