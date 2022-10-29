import { AxiosInstance } from "axios";
import { DepkerClient } from "../client";

export class Api {
  protected readonly client: DepkerClient;
  protected readonly request: AxiosInstance;

  constructor(client: DepkerClient) {
    this.client = client;
    this.request = client.request;
  }
}
