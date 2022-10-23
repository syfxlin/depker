import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

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
