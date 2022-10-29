import { Api } from "./client";
import {
  ConnectVolumeRequest,
  ConnectVolumeResponse,
  DeleteVolumeRequest,
  DeleteVolumeResponse,
  DisconnectVolumeRequest,
  DisconnectVolumeResponse,
  GetVolumeRequest,
  GetVolumeResponse,
  ListVolumeRequest,
  ListVolumeResponse,
  UpsertVolumeRequest,
  UpsertVolumeResponse,
} from "@syfxlin/depker-types";

export class VolumeApi extends Api {
  public async list(request?: ListVolumeRequest) {
    const response = await this.request.get<ListVolumeResponse>(`/api/volumes`, { params: request });
    return response.data;
  }

  public async upsert(request: UpsertVolumeRequest) {
    const response = await this.request.post<UpsertVolumeResponse>(`/api/volumes`, request);
    return response.data;
  }

  public async get(request: GetVolumeRequest) {
    const response = await this.request.get<GetVolumeResponse>(`/api/volumes/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteVolumeRequest) {
    const response = await this.request.delete<DeleteVolumeResponse>(`/api/volumes/${request.name}`);
    return response.data;
  }

  public async connect(request: ConnectVolumeRequest) {
    const response = await this.request.post<ConnectVolumeResponse>(`/api/volumes/${request.name}/connect`, request);
    return response.data;
  }

  public async disconnect(request: DisconnectVolumeRequest) {
    const response = await this.request.delete<DisconnectVolumeResponse>(`/api/volumes/${request.name}/disconnect`, {
      params: request,
    });
    return response.data;
  }
}
