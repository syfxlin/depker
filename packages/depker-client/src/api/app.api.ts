import { Api } from "./client";
import {
  BuildPacksAppResponse,
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
    const response = await this.client.get<ListAppResponse>(`/api/apps/items`, { params: request });
    return response.data;
  }

  public async upsert(request: UpsertAppRequest) {
    const response = await this.client.post<UpsertAppResponse>(`/api/apps/items/${request.name}`, request);
    return response.data;
  }

  public async get(request: GetAppRequest) {
    const response = await this.client.get<GetAppResponse>(`/api/apps/items/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteAppRequest) {
    const response = await this.client.delete<DeleteAppResponse>(`/api/apps/items/${request.name}`);
    return response.data;
  }

  public async status(request: StatusAppRequest) {
    if (!request.names || !request.names.length) {
      return {};
    }
    const response = await this.client.get<StatusAppResponse>(`/api/apps/status`, { params: request });
    return response.data;
  }

  public async buildpacks() {
    const response = await this.client.get<BuildPacksAppResponse>(`/api/apps/buildpacks`);
    return response.data;
  }
}
