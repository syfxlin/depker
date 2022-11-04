import { Api } from "./client";
import {
  DeleteAppRequest,
  DeleteAppResponse,
  DownAppRequest,
  DownAppResponse,
  GetAppRequest,
  GetAppResponse,
  ListAppRequest,
  ListAppResponse,
  LogsAppRequest,
  LogsAppResponse,
  MetricsAppRequest,
  MetricsAppResponse,
  RestartAppRequest,
  RestartAppResponse,
  StatusAppRequest,
  StatusAppResponse,
  UpAppRequest,
  UpAppResponse,
  UpsertAppRequest,
  UpsertAppResponse,
} from "@syfxlin/depker-types";

export class AppApi extends Api {
  public async list(request?: ListAppRequest) {
    const response = await this.request.get<ListAppResponse>(`/api/apps`, {
      params: request,
    });
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

  public async metrics(request: MetricsAppRequest) {
    const response = await this.request.get<MetricsAppResponse>(`/api/apps/${request.name}/metrics`);
    return response.data;
  }

  public async logs(request: LogsAppRequest) {
    const response = await this.request.get<LogsAppResponse>(`/api/apps/${request.name}/logs`, {
      params: request,
    });
    return response.data;
  }

  public async up(request: UpAppRequest) {
    const response = await this.request.post<UpAppResponse>(`/api/apps/${request.name}/up`, request);
    return response.data;
  }

  public async down(request: DownAppRequest) {
    const response = await this.request.post<DownAppResponse>(`/api/apps/${request.name}/down`);
    return response.data;
  }

  public async restart(request: RestartAppRequest) {
    const response = await this.request.post<RestartAppResponse>(`/api/apps/${request.name}/restart`);
    return response.data;
  }
}
