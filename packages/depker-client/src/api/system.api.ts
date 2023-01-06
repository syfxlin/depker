import { Api } from "./client";
import { MetricsResponse, VersionResponse } from "@syfxlin/depker-types";
import { Socket } from "socket.io-client";

export class SystemApi extends Api {
  public async version() {
    const response = await this.client.client.get<VersionResponse>("/api/system/version");
    return response.data;
  }

  public async metrics() {
    const response = await this.client.client.get<MetricsResponse>("/api/system/metrics");
    return response.data;
  }

  public logs(tail: number): Socket {
    return this.client.socket("/nodes/logs", { tail });
  }

  public shell(): Socket {
    return this.client.socket("/nodes/shell");
  }
}
