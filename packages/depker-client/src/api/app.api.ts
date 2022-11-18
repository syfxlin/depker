import { Api } from "./client";
import {
  DeleteAppRequest,
  DeleteAppResponse,
  DownAppRequest,
  DownAppResponse,
  GetAppRequest,
  GetAppResponse,
  HistoryAppRequest,
  HistoryAppResponse,
  ListAppRequest,
  ListAppResponse,
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
import { Socket } from "socket.io-client";

export class AppApi extends Api {
  public async list(request?: ListAppRequest) {
    const response = await this.client.client.get<ListAppResponse>(`/api/apps`, {
      params: request,
    });
    return response.data;
  }

  public async create(request: UpsertAppRequest) {
    const response = await this.client.client.post<UpsertAppResponse>(`/api/apps`, request);
    return response.data;
  }

  public async update(request: UpsertAppRequest) {
    const response = await this.client.client.put<UpsertAppResponse>(`/api/apps/${request.name}`, request);
    return response.data;
  }

  public async get(request: GetAppRequest) {
    const response = await this.client.client.get<GetAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteAppRequest) {
    const response = await this.client.client.delete<DeleteAppResponse>(`/api/apps/${request.name}`);
    return response.data;
  }

  public async status(request: StatusAppRequest) {
    const response = await this.client.client.get<StatusAppResponse>(`/api/apps/${request.name}/status`);
    return response.data;
  }

  public async metrics(request: MetricsAppRequest) {
    const response = await this.client.client.get<MetricsAppResponse>(`/api/apps/${request.name}/metrics`);
    return response.data;
  }

  public async history(request: HistoryAppRequest) {
    const response = await this.client.client.get<HistoryAppResponse>(`/api/apps/${request.name}/history`, {
      params: request,
    });
    return response.data;
  }

  public async up(request: UpAppRequest) {
    const response = await this.client.client.post<UpAppResponse>(`/api/apps/${request.name}/up`, request);
    return response.data;
  }

  public async down(request: DownAppRequest) {
    const response = await this.client.client.post<DownAppResponse>(`/api/apps/${request.name}/down`);
    return response.data;
  }

  public async restart(request: RestartAppRequest) {
    const response = await this.client.client.post<RestartAppResponse>(`/api/apps/${request.name}/restart`);
    return response.data;
  }

  public logs(name: string, tail?: number): Socket {
    return this.client.socket("/containers/logs", { name, tail });
  }

  public terminal(name: string): Socket {
    return this.client.socket("/containers/terminal", { name });
  }
}
