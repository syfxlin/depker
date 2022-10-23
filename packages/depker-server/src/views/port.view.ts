import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";
import { IsValidate } from "../validation/is-validate.validation";
import { Setting } from "../entities/setting.entity";

export class GetPortRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type GetPortResponse = {
  name: string;
  proto: "tcp" | "udp";
  port: number;
  createdAt: Date;
  updatedAt: Date;
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
    proto: "tcp" | "udp";
    port: number;
    binds: string[];
    createdAt: Date;
    updatedAt: Date;
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
  proto: "tcp" | "udp";

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

export type DeletePortResponse = {
  status: "success" | "failure";
};

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

export type ConnectPortResponse = {
  status: "success" | "failure";
};

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

export type DisconnectPortResponse = {
  status: "success" | "failure";
};
