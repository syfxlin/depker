import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateDeployRequest {
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

export type CreateDeployResponse = {
  id: string;
  app: string;
  commit: string;
  status: string;
  trigger: string;
  force: boolean;
  createdAt: Date;
  updatedAt: Date;
};
