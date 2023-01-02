import { Api } from "./client";
import {
  GetPluginSettingRequest,
  GetPluginSettingResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginRequest,
  ListPluginResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
  UpdatePluginSettingRequest,
  UpdatePluginSettingResponse,
} from "@syfxlin/depker-types";

export class PluginApi extends Api {
  public async list(request: ListPluginRequest) {
    const response = await this.client.client.get<ListPluginResponse>(`/api/plugins`, { params: request });
    return response.data;
  }

  public async install(request: InstallPluginRequest) {
    const response = await this.client.client.post<InstallPluginResponse>(`/api/plugins/${request.name}`);
    return response.data;
  }

  public async uninstall(request: UninstallPluginRequest) {
    const response = await this.client.client.delete<UninstallPluginResponse>(`/api/plugins/${request.name}`);
    return response.data;
  }

  public async get(request: GetPluginSettingRequest) {
    const response = await this.client.client.get<GetPluginSettingResponse>(`/api/plugins/settings/${request.name}`);
    return response.data;
  }

  public async set(request: UpdatePluginSettingRequest) {
    const response = await this.client.client.put<UpdatePluginSettingResponse>(
      `/api/plugins/settings/${request.name}`,
      request
    );
    return response.data;
  }

  public async routes(name: string, path: string) {
    const url = new URL(`/api/plugins/routes/${name}/${path}`, this.client.endpoint);
    return url.toString();
  }
}
