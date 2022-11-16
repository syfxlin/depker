import { Api } from "./client";
import {
  BindsVolumeRequest,
  BindsVolumeResponse,
  CreateVolumeRequest,
  CreateVolumeResponse,
  DeleteVolumeRequest,
  DeleteVolumeResponse,
  ListVolumeResponse,
} from "@syfxlin/depker-types";

export class VolumeApi extends Api {
  public async list() {
    const response = await this.request.get<ListVolumeResponse>(`/api/volumes`);
    return response.data;
  }

  public async create(request: CreateVolumeRequest) {
    const response = await this.request.post<CreateVolumeResponse>(`/api/volumes`, request);
    return response.data;
  }

  public async delete(request: DeleteVolumeRequest) {
    const response = await this.request.delete<DeleteVolumeResponse>(`/api/volumes`, { params: request });
    return response.data;
  }

  public async binds(request: BindsVolumeRequest) {
    const response = await this.request.get<BindsVolumeResponse>(`/api/volumes/${request.volume}/binds`);
    return response.data;
  }
}
