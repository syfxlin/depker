import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from "class-validator";

export class GetVolumeRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type GetVolumeResponse = {
  name: string;
  path: string;
  global: boolean;
  createdAt: number;
  updatedAt: number;
  binds: Array<{
    name: string;
    path: string;
    readonly: boolean;
  }>;
};

export class ListVolumeRequest {
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

export type ListVolumeResponse = {
  total: number;
  items: Array<{
    name: string;
    global: boolean;
    path: string;
    binds: string[];
    createdAt: number;
    updatedAt: number;
  }>;
};

export class UpsertVolumeRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsBoolean()
  global: boolean;
}

export type UpsertVolumeResponse = GetVolumeResponse;

export class DeleteVolumeRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeleteVolumeResponse = {
  status: "success" | "failure";
};

export class ConnectVolumeRequest {
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

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsBoolean()
  readonly: boolean;
}

export type ConnectVolumeResponse = {
  status: "success" | "failure";
};

export class DisconnectVolumeRequest {
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

export type DisconnectVolumeResponse = {
  status: "success" | "failure";
};
