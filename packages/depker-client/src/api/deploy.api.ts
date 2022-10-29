import { Api } from "./client";
import {
  CancelDeployRequest,
  CancelDeployResponse,
  DispatchDeployRequest,
  DispatchDeployResponse,
  GetDeployRequest,
  GetDeployResponse,
  ListDeployRequest,
  ListDeployResponse,
  LogsDeployRequest,
  LogsDeployResponse,
} from "@syfxlin/depker-types";

export class DeployApi extends Api {
  public async list(request: ListDeployRequest) {
    const response = await this.request.get<ListDeployResponse>(`/api/deploy`, { params: request });
    return response.data;
  }

  public async dispatch(request: DispatchDeployRequest) {
    const response = await this.request.post<DispatchDeployResponse>(`/api/deploy`, request);
    return response.data;
  }

  public async get(request: GetDeployRequest) {
    const response = await this.request.get<GetDeployResponse>(`/api/deploy/${request.id}`);
    return response.data;
  }

  public async cancel(request: CancelDeployRequest) {
    const response = await this.request.delete<CancelDeployResponse>(`/api/deploy/${request.id}`);
    return response.data;
  }

  public async logs(request: LogsDeployRequest) {
    const response = await this.request.get<LogsDeployResponse>(`/api/deploy/${request.id}/logs`, { params: request });
    return response.data;
  }
}
