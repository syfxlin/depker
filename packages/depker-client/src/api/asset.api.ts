import { Api } from "./client";

export class AssetApi extends Api {
  public icon(name: string | undefined | null) {
    if (!name) {
      return undefined;
    }
    const url = new URL(`/api/icons/${name}`, this.client.endpoint);
    return url.toString();
  }
}
