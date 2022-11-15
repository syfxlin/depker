import { Api } from "./client";
import { ListVolumeResponse } from "@syfxlin/depker-types";

export class VolumeApi extends Api {
  public async list() {
    const response = await this.request.get<ListVolumeResponse>(`/api/volumes`);
    return response.data;
  }
}
