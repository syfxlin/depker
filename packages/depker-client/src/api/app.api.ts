import { Api } from "./client";
import {
  AppStatusRequest,
  AppStatusResponse,
  DeleteAppRequest,
  DeleteAppResponse,
  GetAppRequest,
  GetAppResponse,
  ListAppRequest,
  ListAppResponse,
  UpsertAppRequest,
  UpsertAppResponse,
} from "@syfxlin/depker-types";

export class AppApi extends Api {
  public async list(request?: ListAppRequest) {
    const response = await this.client.get<ListAppResponse>(`/api/apps`, { params: request });
    return response.data;
  }

  public async upsert(request: UpsertAppRequest) {
    const response = await this.client.post<UpsertAppResponse>(`/api/apps/${request.name}`, request);
    return response.data;
  }

  public async get(request: GetAppRequest) {
    const response = await this.client.get<GetAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteAppRequest) {
    const response = await this.client.delete<DeleteAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async status(request: AppStatusRequest) {
    if (!request.names || !request.names.length) {
      return {};
    }
    const response = await this.client.get<AppStatusResponse>(`/api/status/apps`, { params: request });
    return response.data;
  }
}
