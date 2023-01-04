import { IsInt, isNotEmpty, IsNotEmpty, IsOptional, isString, IsString, Matches, Min } from "class-validator";
import { DepkerPluginOption } from "../plugins/plugin.types";
import { RecordEach } from "../validation/record-each.validation";

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
    pkg: string;
    name: string;
    label?: string;
    group?: string;
    icon?: string;
    buildpack: boolean;
    options: boolean;
  }>;
};

export class InstallPluginRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type InstallPluginResponse = {
  status: "success";
};

export class UninstallPluginRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type UninstallPluginResponse = {
  status: "success";
};

export class GetPluginSettingRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type GetPluginSettingResponse = {
  options: DepkerPluginOption[];
  values: Record<string, any>;
};

export class UpdatePluginSettingRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @RecordEach([isString, isNotEmpty])
  values: Record<string, any>;
}

export type UpdatePluginSettingResponse = GetPluginSettingResponse;
