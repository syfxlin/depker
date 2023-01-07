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
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<ListServiceCronResponse>(`/api/services/${name}/crons`, {
      params: request,
    });
    return response.data;
  }

  public async logs(request: LogsServiceCronRequest) {
    const name = encodeURIComponent(request.name);
    const id = encodeURIComponent(request.id);
    const response = await this.client.client.get<LogsServiceCronResponse>(`/api/services/${name}/crons/${id}/logs`, {
      params: request,
    });
    return response.data;
  }

  public async cancel(request: CancelServiceCronRequest) {
    const name = encodeURIComponent(request.name);
    const id = encodeURIComponent(request.id);
    const response = await this.client.client.delete<CancelServiceCronResponse>(
      `/api/services/${name}/crons/${id}/cancel`
    );
    return response.data;
  }
}
