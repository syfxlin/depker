import { Api } from "./client";
import { ListBuildPackResponse } from "@syfxlin/depker-types";

export class BuildpackApi extends Api {
  public async list() {
    const response = await this.client.get<ListBuildPackResponse>(`/api/buildpacks`);
    return response.data;
  }
}
