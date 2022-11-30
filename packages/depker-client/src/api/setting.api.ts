import { Api } from "./client";
import { GetSettingResponse, UpdateSettingRequest, UpdateSettingResponse } from "@syfxlin/depker-types";

export class SettingApi extends Api {
  public async get() {
    const response = await this.client.client.get<GetSettingResponse>(`/api/settings`);
    return response.data;
  }

  public async update(request: UpdateSettingRequest) {
    const response = await this.client.client.put<UpdateSettingResponse>(`/api/settings`, request);
    return response.data;
  }
}
