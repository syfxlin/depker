import { Api } from "./client";
import {
  CancelServiceDeployRequest,
  CancelServiceDeployResponse,
  ListServiceDeployRequest,
  ListServiceDeployResponse,
  LogsServiceDeployRequest,
  LogsServiceDeployResponse,
} from "@syfxlin/depker-types";

export class DeployApi extends Api {
  public async list(request: ListServiceDeployRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<ListServiceDeployResponse>(`/api/services/${name}/deploys`, {
      params: request,
    });
    return response.data;
  }

  public async logs(request: LogsServiceDeployRequest) {
    const name = encodeURIComponent(request.name);
    const id = encodeURIComponent(request.id);
    const response = await this.client.client.get<LogsServiceDeployResponse>(
      `/api/services/${name}/deploys/${id}/logs`,
      { params: request }
    );
    return response.data;
  }

  public async cancel(request: CancelServiceDeployRequest) {
    const name = encodeURIComponent(request.name);
    const id = encodeURIComponent(request.id);
    const response = await this.client.client.delete<CancelServiceDeployResponse>(
      `/api/services/${name}/deploys/${id}/cancel`
    );
    return response.data;
  }
}
