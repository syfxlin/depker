import { IsNotEmpty, IsString } from "class-validator";

export type ListVolumeResponse = Array<string>;

export class CreateVolumeRequest {
  @IsString()
  @IsNotEmpty()
  volume: string;
}

export type CreateVolumeResponse = {
  status: "success";
};

export class DeleteVolumeRequest {
  @IsString()
  @IsNotEmpty()
  volume: string;
}

export type DeleteVolumeResponse = {
  status: "success";
};

export class BindsVolumeRequest {
  @IsString()
  @IsNotEmpty()
  volume: string;
}

export type BindsVolumeResponse = Array<string>;
