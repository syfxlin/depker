import { AxiosInstance } from "axios";

export class Api {
  protected readonly client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }
}
