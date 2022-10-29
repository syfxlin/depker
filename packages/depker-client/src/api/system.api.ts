import { Api } from "./client";
import { LogsRequest, LogsResponse, MetricsResponse, VersionResponse } from "@syfxlin/depker-types";

export class SystemApi extends Api {
  public async version() {
    const response = await this.request.get<VersionResponse>("/api/system/version");
    return response.data;
  }

  public async metrics() {
    const response = await this.request.get<MetricsResponse>("/api/system/metrics");
    return response.data;
  }

  public async logs(request?: LogsRequest) {
    const data = request ? { lines: String(request.lines) } : {};
    const response = await this.request.get<LogsResponse>("/api/system/logs", { params: data });
    return response.data;
  }
}
