import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

export class ListImageRequest {
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

export type ListImageResponse = {
  total: number;
  items: Array<{
    id: string;
    tags: string[];
    created: number;
    size: number;
    containers: Array<{
      id: string;
      name: string;
      image: string;
    }>;
  }>;
};

export class CreateImageRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type CreateImageResponse = {
  status: "success";
};

export class DeleteImageRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type DeleteImageResponse = {
  status: "success";
};
