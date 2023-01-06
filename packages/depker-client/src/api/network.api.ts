import { Api } from "./client";
import {
  ConnectNetworkRequest,
  ConnectNetworkResponse,
  CreateNetworkRequest,
  CreateNetworkResponse,
  DeleteNetworkRequest,
  DeleteNetworkResponse,
  DisconnectNetworkRequest,
  DisconnectNetworkResponse,
  ListNetworkRequest,
  ListNetworkResponse,
} from "@syfxlin/depker-types";

export class NetworkApi extends Api {
  public async list(request: ListNetworkRequest) {
    const response = await this.client.client.get<ListNetworkResponse>(`/api/networks`, { params: request });
    return response.data;
  }

  public async create(request: CreateNetworkRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<CreateNetworkResponse>(`/api/networks/${name}`);
    return response.data;
  }

  public async delete(request: DeleteNetworkRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<DeleteNetworkResponse>(`/api/networks/${name}`, {
      params: request,
    });
    return response.data;
  }

  public async connect(request: ConnectNetworkRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<ConnectNetworkResponse>(
      `/api/networks/${name}/connect/${request.container}`
    );
    return response.data;
  }

  public async disconnect(request: DisconnectNetworkRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<DisconnectNetworkResponse>(
      `/api/networks/${name}/disconnect/${request.container}`
    );
    return response.data;
  }
}
