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
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<InstallPluginResponse>(`/api/plugins/${name}`);
    return response.data;
  }

  public async uninstall(request: UninstallPluginRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<UninstallPluginResponse>(`/api/plugins/${name}`);
    return response.data;
  }

  public async get(request: GetPluginSettingRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.get<GetPluginSettingResponse>(`/api/plugins/settings/${name}`);
    return response.data;
  }

  public async set(request: UpdatePluginSettingRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.put<UpdatePluginSettingResponse>(
      `/api/plugins/settings/${name}`,
      request
    );
    return response.data;
  }

  public async routes(name: string, path: string) {
    const url = new URL(`/api/plugins/routes/${name}/${path}`, this.client.endpoint);
    return url.toString();
  }
}
