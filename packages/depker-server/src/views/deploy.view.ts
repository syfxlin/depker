import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from "class-validator";

export class ListDeployRequest {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  app?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  commit?: string;

  @IsString()
  @IsOptional()
  @IsIn(["queued", "running", "failed", "success"])
  status?: "queued" | "running" | "failed" | "success";

  @IsString()
  @IsOptional()
  @IsIn(["manual", "depker", "git"])
  trigger?: "manual" | "depker" | "git";

  @IsBoolean()
  @IsOptional()
  force?: boolean;

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

export type ListDeployResponse = {
  total: number;
  items: Array<GetDeployResponse>;
};

export class GetDeployRequest {
  @IsInt()
  @Min(0)
  id: number;
}

export type GetDeployResponse = {
  id: number;
  app: string;
  commit: string;
  status: string;
  trigger: string;
  force: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class DispatchDeployRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  app: string;

  @IsString()
  @IsNotEmpty()
  ref: string;

  @IsOptional()
  @IsString()
  @IsIn(["manual", "depker", "git"])
  trigger?: "manual" | "depker" | "git";

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export type DispatchDeployResponse = GetDeployResponse;

export class CancelDeployRequest {
  @IsInt()
  @Min(0)
  id: number;
}

export type CancelDeployResponse = {
  status: "success" | "failure";
};
