import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

export class ListNetworkRequest {
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

export type ListNetworkResponse = {
  total: number;
  items: Array<{
    name: string;
    id: string;
    scope: string;
    driver: string;
    ips: Array<{
      gateway: string;
      subnet: string;
    }>;
    containers: Array<{
      id: string;
      name: string;
      ip: string;
      mac: string;
    }>;
  }>;
};

export class CreateNetworkRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type CreateNetworkResponse = {
  status: "success";
};

export class DeleteNetworkRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export type DeleteNetworkResponse = {
  status: "success";
};

export class ConnectNetworkRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  container: string;
}

export type ConnectNetworkResponse = {
  status: "success";
};

export class DisconnectNetworkRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  container: string;
}

export type DisconnectNetworkResponse = {
  status: "success";
};
