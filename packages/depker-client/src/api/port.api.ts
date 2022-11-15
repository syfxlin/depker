import { Api } from "./client";
import { ListPortResponse } from "@syfxlin/depker-types";

export class PortApi extends Api {
  public async list() {
    const response = await this.request.get<ListPortResponse>(`/api/ports`);
    return response.data;
  }
}
