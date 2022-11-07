import { Api } from "./client";

export class FilesApi extends Api {
  public iframe() {
    const url = new URL(`/api/files`, this.client.endpoint);
    return url.toString();
  }
}
