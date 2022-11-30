import {
  IsBoolean,
  IsEmail,
  IsInt,
  isNotEmpty,
  IsOptional,
  isString,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import { ObjectEach } from "../validation/object-each.validation";

export type GetSettingResponse = {
  // infos
  email: string;
  username: string;
  // options
  upgrade: boolean;
  purge: boolean;
  concurrency: number;
  dashboard: string;
  tls: {
    type: string;
    env?: Record<string, string>;
  };
};

export class UpdateSettingRequest {
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username?: string;

  @IsOptional()
  @IsBoolean()
  upgrade?: boolean;

  @IsOptional()
  @IsBoolean()
  purge?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  concurrency?: number;

  @IsOptional()
  @IsString()
  dashboard?: string;

  @IsOptional()
  @ObjectEach({
    type: [isString, isNotEmpty],
  })
  tls: {
    type: string;
    env?: Record<string, string>;
  };
}

export type UpdateSettingResponse = GetSettingResponse;
