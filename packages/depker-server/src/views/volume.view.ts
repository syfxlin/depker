import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

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
    createdAt: Date;
    updatedAt: Date;
  }>;
};
