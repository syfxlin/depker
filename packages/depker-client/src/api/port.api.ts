import { Api } from "./client";
import {
  BindsPortRequest,
  BindsPortResponse,
  CreatePortRequest,
  CreatePortResponse,
  DeletePortRequest,
  DeletePortResponse,
  ListPortResponse,
} from "@syfxlin/depker-types";

export class PortApi extends Api {
  public async list() {
    const response = await this.client.client.get<ListPortResponse>(`/api/ports`);
    return response.data;
  }

  public async create(request: CreatePortRequest) {
    const name = encodeURIComponent(request.port);
    const response = await this.client.client.post<CreatePortResponse>(`/api/ports/${name}`);
    return response.data;
  }

  public async delete(request: DeletePortRequest) {
    const name = encodeURIComponent(request.port);
    const response = await this.client.client.delete<DeletePortResponse>(`/api/ports/${name}`);
    return response.data;
  }

  public async binds(request: BindsPortRequest) {
    const name = encodeURIComponent(request.port);
    const response = await this.client.client.get<BindsPortResponse>(`/api/ports/${name}/binds`);
    return response.data;
  }
}
