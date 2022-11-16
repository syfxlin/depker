import { IsInt, Max, Min } from "class-validator";

export type ListPortResponse = Array<number>;

export class CreatePortRequest {
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}

export type CreatePortResponse = {
  status: "success";
};

export class DeletePortRequest {
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}

export type DeletePortResponse = {
  status: "success";
};

export class BindsPortRequest {
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}

export type BindsPortResponse = Array<string>;
