import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";
import { IsValidate } from "../validation/is-validate.validation";
import { Setting } from "../entities/setting.entity";
import { PortProtocol } from "../entities/port.entity";
import { SuccessResponse } from "./common.view";

export class GetPortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type GetPortResponse = {
  name: string;
  proto: PortProtocol;
  port: number;
  createdAt: number;
  updatedAt: number;
  binds: Array<{
    name: string;
    port: number;
  }>;
};

export class ListPortRequest {
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

  @IsBoolean()
  @IsOptional()
  all?: boolean;
}

export type ListPortResponse = {
  total: number;
  items: Array<{
    name: string;
    proto: PortProtocol;
    port: number;
    binds: string[];
    createdAt: number;
    updatedAt: number;
  }>;
};

export class UpsertPortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(["tcp", "udp"])
  proto: PortProtocol;

  @IsInt()
  @IsValidate(async (value: number) => {
    const setting = await Setting.read();
    return setting.ports[0] <= value && value <= setting.ports[1];
  })
  port: number;
}

export type UpsertPortResponse = GetPortResponse;

export class DeletePortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeletePortResponse = SuccessResponse;

export class ConnectPortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  app: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}

export type ConnectPortResponse = SuccessResponse;

export class DisconnectPortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  app: string;
}

export type DisconnectPortResponse = SuccessResponse;
