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
  RestartServiceRequest,
  RestartServiceResponse,
  StatusServiceRequest,
  StatusServiceResponse,
  UpsertServiceRequest,
  UpsertServiceResponse,
  UpServiceRequest,
  UpServiceResponse,
} from "@syfxlin/depker-types";

export class ServiceApi extends Api {
  public async list(request?: ListServiceRequest) {
    const response = await this.client.client.get<ListServiceResponse>(`/api/services`, {
      params: request,
    });
    return response.data;
  }

  public async upsert(request: UpsertServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<UpsertServiceResponse>(`/api/services/${name}`, request);
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

  // endregion

  // region type=job

  public async trigger(request: RestartServiceRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<RestartServiceResponse>(`/api/services/${name}/trigger`);
    return response.data;
  }

  // endregion
}
