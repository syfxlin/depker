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
    const response = await this.client.client.get<ListServiceDeployResponse>(`/api/services/${request.name}/deploy`, {
      params: request,
    });
    return response.data;
  }

  public async logs(request: LogsServiceDeployRequest) {
    const response = await this.client.client.get<LogsServiceDeployResponse>(
      `/api/services/${request.name}/deploy/${request.id}/logs`,
      { params: request }
    );
    return response.data;
  }

  public async cancel(request: CancelServiceDeployRequest) {
    const response = await this.client.client.delete<CancelServiceDeployResponse>(
      `/api/services/${request.name}/deploy/${request.id}/cancel`
    );
    return response.data;
  }
}
