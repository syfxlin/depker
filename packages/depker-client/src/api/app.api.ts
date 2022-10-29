import { Api } from "./client";
import {
  DeleteAppRequest,
  DeleteAppResponse,
  GetAppRequest,
  GetAppResponse,
  ListAppRequest,
  ListAppResponse,
  StatusAppRequest,
  StatusAppResponse,
  UpsertAppRequest,
  UpsertAppResponse,
} from "@syfxlin/depker-types";

export class AppApi extends Api {
  public async list(request?: ListAppRequest) {
    const response = await this.request.get<ListAppResponse>(`/api/apps`, { params: request });
    return response.data;
  }

  public async upsert(request: UpsertAppRequest) {
    const response = await this.request.post<UpsertAppResponse>(`/api/apps`, request);
    return response.data;
  }

  public async get(request: GetAppRequest) {
    const response = await this.request.get<GetAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteAppRequest) {
    const response = await this.request.delete<DeleteAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async status(request: StatusAppRequest) {
    const response = await this.request.get<StatusAppResponse>(`/api/apps/${request.name}/status`);
    return response.data;
  }
}
