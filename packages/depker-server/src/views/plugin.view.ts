import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

export class ListPluginRequest {
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

export type ListPluginResponse = {
  total: number;
  items: Array<{
    name: string;
    label?: string;
    group?: string;
    icon?: string;
  }>;
};

export class InstallPluginRequest {
  @IsString()
  @IsNotEmpty()
  pkg: string;
}

export type InstallPluginResponse = {
  status: "success";
};

export class UninstallPluginRequest {
  @IsString()
  @IsNotEmpty()
  pkg: string;
}

export type UninstallPluginResponse = {
  status: "success";
};
