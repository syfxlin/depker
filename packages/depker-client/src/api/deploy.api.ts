import { Api } from "./client";
import {
  CancelAppDeployRequest,
  CancelAppDeployResponse,
  ListAppDeployRequest,
  ListAppDeployResponse,
  LogsAppDeployRequest,
  LogsAppDeployResponse,
} from "@syfxlin/depker-types";

export class DeployApi extends Api {
  public async list(request: ListAppDeployRequest) {
    const response = await this.client.client.get<ListAppDeployResponse>(`/api/apps/${request.name}/deploy`, {
      params: request,
    });
    return response.data;
  }

  public async logs(request: LogsAppDeployRequest) {
    const response = await this.client.client.get<LogsAppDeployResponse>(
      `/api/apps/${request.name}/deploy/${request.id}/logs`,
      { params: request }
    );
    return response.data;
  }

  public async cancel(request: CancelAppDeployRequest) {
    const response = await this.client.client.delete<CancelAppDeployResponse>(
      `/api/apps/${request.name}/deploy/${request.id}/cancel`
    );
    return response.data;
  }
}
