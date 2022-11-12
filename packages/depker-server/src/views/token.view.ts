import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from "class-validator";

export class ListTokenRequest {
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

export type ListTokenResponse = {
  total: number;
  items: Array<{
    name: string;
    identity: string;
    createdAt: number;
    updatedAt: number;
  }>;
};

export class UpsertTokenRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type UpsertTokenResponse = {
  name: string;
  identity: string;
  token: string;
  createdAt: number;
  updatedAt: number;
};

export class DeleteTokenRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  name: string;
}

export type DeleteTokenResponse = {
  status: "success";
};
