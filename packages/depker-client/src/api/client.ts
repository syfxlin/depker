import { DepkerClient } from "../client";

export class Api {
  protected readonly client: DepkerClient;

  constructor(client: DepkerClient) {
    this.client = client;
  }
}
