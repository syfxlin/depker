import { Api } from "./client";
import {
  CancelServiceCronRequest,
  CancelServiceCronResponse,
  ListServiceCronRequest,
  ListServiceCronResponse,
  LogsServiceCronRequest,
  LogsServiceCronResponse,
} from "@syfxlin/depker-types";

export class CronApi extends Api {
  public async list(request: ListServiceCronRequest) {
    const response = await this.client.client.get<ListServiceCronResponse>(`/api/services/${request.name}/crons`, {
      params: request,
    });
    return response.data;
  }

  public async logs(request: LogsServiceCronRequest) {
    const response = await this.client.client.get<LogsServiceCronResponse>(
      `/api/services/${request.name}/crons/${request.id}/logs`,
      { params: request }
    );
    return response.data;
  }

  public async cancel(request: CancelServiceCronRequest) {
    const response = await this.client.client.delete<CancelServiceCronResponse>(
      `/api/services/${request.name}/crons/${request.id}/cancel`
    );
    return response.data;
  }
}
