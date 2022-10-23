import { Api } from "./client";
import { ListVolumeRequest, ListVolumeResponse } from "@syfxlin/depker-types/dist/src/views/volume.view";

export class VolumeApi extends Api {
  public async list(request?: ListVolumeRequest) {
    const response = await this.client.get<ListVolumeResponse>(`/api/volumes`, { params: request });
    return response.data;
  }
}
