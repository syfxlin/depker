import { Api } from "./client";
import {
  ConnectPortRequest,
  ConnectPortResponse,
  DeletePortRequest,
  DeletePortResponse,
  DisconnectPortRequest,
  DisconnectPortResponse,
  GetPortRequest,
  GetPortResponse,
  ListPortRequest,
  ListPortResponse,
  UpsertPortRequest,
  UpsertPortResponse,
} from "@syfxlin/depker-types";

export class PortApi extends Api {
  public async list(request?: ListPortRequest) {
    const response = await this.request.get<ListPortResponse>(`/api/ports`, {
      params: request,
    });
    return response.data;
  }

  public async create(request: UpsertPortRequest) {
    const response = await this.request.post<UpsertPortResponse>(`/api/ports`, request);
    return response.data;
  }

  public async update(request: UpsertPortRequest) {
    const response = await this.request.put<UpsertPortResponse>(`/api/ports/${request.name}`, request);
    return response.data;
  }

  public async get(request: GetPortRequest) {
    const response = await this.request.get<GetPortResponse>(`/api/ports/${request.name}`);
    return response.data;
  }

  public async delete(request: DeletePortRequest) {
    const response = await this.request.delete<DeletePortResponse>(`/api/ports/${request.name}`);
    return response.data;
  }

  public async connect(request: ConnectPortRequest) {
    const response = await this.request.post<ConnectPortResponse>(`/api/ports/${request.name}/connect`, request);
    return response.data;
  }

  public async disconnect(request: DisconnectPortRequest) {
    const response = await this.request.delete<DisconnectPortResponse>(`/api/ports/${request.name}/disconnect`, {
      params: request,
    });
    return response.data;
  }
}
