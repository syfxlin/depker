import { Api } from "./client";
import { AccessLogRequest, AccessLogResponse, MetricsResponse, VersionResponse } from "@syfxlin/depker-types";

export class InfoApi extends Api {
  public async version() {
    const response = await this.client.get<VersionResponse>("/api/infos/version");
    return response.data;
  }

  public async metrics() {
    const response = await this.client.get<MetricsResponse>("/api/infos/metrics");
    return response.data;
  }

  public async logs(data?: AccessLogRequest) {
    const request = data ? { lines: String(data.lines) } : {};
    const response = await this.client.get<AccessLogResponse>("/api/infos/logs", { params: request });
    return response.data;
  }
}
