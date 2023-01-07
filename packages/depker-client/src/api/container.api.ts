import { Api } from "./client";
import {
  DeleteContainerRequest,
  DeleteContainerResponse,
  ListContainerRequest,
  ListContainerResponse,
  LogsContainerRequest,
  MetricsContainerRequest,
  OperateContainerRequest,
  OperateContainerResponse,
  RenameContainerRequest,
  RenameContainerResponse,
  TerminalContainerRequest,
} from "@syfxlin/depker-types";
import { Socket } from "socket.io-client";

export class ContainerApi extends Api {
  public async list(request: ListContainerRequest) {
    const response = await this.client.client.get<ListContainerResponse>(`/api/containers`, { params: request });
    return response.data;
  }

  public async rename(request: RenameContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.put<RenameContainerResponse>(`/api/containers/${name}`, request);
    return response.data;
  }

  public async delete(request: DeleteContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<DeleteContainerResponse>(`/api/containers/${name}`);
    return response.data;
  }

  public async start(request: OperateContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<OperateContainerResponse>(`/api/containers/${name}/start`);
    return response.data;
  }

  public async restart(request: OperateContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<OperateContainerResponse>(`/api/containers/${name}/restart`);
    return response.data;
  }

  public async stop(request: OperateContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<OperateContainerResponse>(`/api/containers/${name}/stop`);
    return response.data;
  }

  public async kill(request: OperateContainerRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<OperateContainerResponse>(`/api/containers/${name}/kill`);
    return response.data;
  }

  public metrics(request: MetricsContainerRequest): Socket {
    return this.client.socket("/containers/metrics", { name: request.name });
  }

  public logs(request: LogsContainerRequest): Socket {
    return this.client.socket("/containers/logs", { name: request.name, tail: request.tail });
  }

  public terminal(request: TerminalContainerRequest): Socket {
    return this.client.socket("/containers/terminal", { name: request.name });
  }
}
