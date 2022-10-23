import { Api } from "./client";
import { ListPortRequest, ListPortResponse } from "@syfxlin/depker-types/dist/src/views/port.view";

export class PortApi extends Api {
  public async list(request?: ListPortRequest) {
    const response = await this.client.get<ListPortResponse>(`/api/ports`, { params: request });
    return response.data;
  }
}
