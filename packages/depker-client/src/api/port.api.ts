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
    const response = await this.client.client.post<CreatePortResponse>(`/api/ports`, request);
    return response.data;
  }

  public async delete(request: DeletePortRequest) {
    const response = await this.client.client.delete<DeletePortResponse>(`/api/ports`, { params: request });
    return response.data;
  }

  public async binds(request: BindsPortRequest) {
    const response = await this.client.client.get<BindsPortResponse>(`/api/ports/${request.port}/binds`);
    return response.data;
  }
}
