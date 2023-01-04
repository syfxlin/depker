import { Api } from "./client";
import {
  DeleteServiceRequest,
  DeleteServiceResponse,
  DownServiceRequest,
  DownServiceResponse,
  GetServiceRequest,
  GetServiceResponse,
  HistoryServiceRequest,
  HistoryServiceResponse,
  ListServiceRequest,
  ListServiceResponse,
  MetricsServiceRequest,
  MetricsServiceResponse,
  RestartServiceRequest,
  RestartServiceResponse,
  StatusServiceRequest,
  StatusServiceResponse,
  UpsertServiceRequest,
  UpsertServiceResponse,
  UpServiceRequest,
  UpServiceResponse,
} from "@syfxlin/depker-types";
import { Socket } from "socket.io-client";

export class ServiceApi extends Api {
  public async list(request?: ListServiceRequest) {
    const response = await this.client.client.get<ListServiceResponse>(`/api/services`, {
      params: request,
    });
    return response.data;
  }

  public async create(request: UpsertServiceRequest) {
    const response = await this.client.client.post<UpsertServiceResponse>(`/api/services`, request);
    return response.data;
  }

  public async update(request: UpsertServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.put<UpsertServiceResponse>(`/api/services/${name}`, request);
    return response.data;
  }

  public async get(request: GetServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<GetServiceResponse>(`/api/services/${name}`);
    return response.data;
  }

  public async delete(request: DeleteServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<DeleteServiceResponse>(`/api/services/${name}`);
    return response.data;
  }

  public async status(request: StatusServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<StatusServiceResponse>(`/api/services/${name}/status`);
    return response.data;
  }

  public async history(request: HistoryServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<HistoryServiceResponse>(`/api/services/${name}/history`, {
      params: request,
    });
    return response.data;
  }

  public async up(request: UpServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<UpServiceResponse>(`/api/services/${name}/up`, request);
    return response.data;
  }

  public async down(request: DownServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<DownServiceResponse>(`/api/services/${name}/down`);
    return response.data;
  }

  // region type=app

  public async restart(request: RestartServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<RestartServiceResponse>(`/api/services/${name}/restart`);
    return response.data;
  }

  public async metrics(request: MetricsServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<MetricsServiceResponse>(`/api/services/${name}/metrics`);
    return response.data;
  }

  public logs(name: string, tail?: number): Socket {
    return this.client.socket("/containers/logs", { name, tail });
  }

  public terminal(name: string): Socket {
    return this.client.socket("/containers/terminal", { name });
  }

  // endregion

  // region type=job

  public async trigger(request: RestartServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<RestartServiceResponse>(`/api/services/${name}/trigger`);
    return response.data;
  }

  // endregion
}
