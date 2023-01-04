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
    const response = await this.client.client.get<ListVolumeResponse>(`/api/volumes`);
    return response.data;
  }

  public async create(request: CreateVolumeRequest) {
    const name = encodeURIComponent(request.volume);
    const response = await this.client.client.post<CreateVolumeResponse>(`/api/volumes/${name}`);
    return response.data;
  }

  public async delete(request: DeleteVolumeRequest) {
    const name = encodeURIComponent(request.volume);
    const response = await this.client.client.delete<DeleteVolumeResponse>(`/api/volumes/${name}`);
    return response.data;
  }

  public async binds(request: BindsVolumeRequest) {
    const name = encodeURIComponent(request.volume);
    const response = await this.client.client.get<BindsVolumeResponse>(`/api/volumes/${name}/binds`);
    return response.data;
  }
}
