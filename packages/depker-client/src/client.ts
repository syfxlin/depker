import axios, { AxiosInstance } from "axios";
import qs from "qs";
import axiosRetry from "axios-retry";
import { AuthApi } from "./api/auth.api";
import { InfoApi } from "./api/info.api";

export interface DepkerClientOptions {
  endpoint: string;
  timeout?: number;
  retries?: number;
  token?: () => string | null | undefined;
  client?: (endpoint: string) => AxiosInstance | null | undefined;
}

export class DepkerClient {
  public readonly client: AxiosInstance;
  public readonly auth: AuthApi;
  public readonly info: InfoApi;

  constructor(options: DepkerClientOptions) {
    this.client = options.client?.(options.endpoint) ?? axios.create({ baseURL: options.endpoint });
    this.client.defaults.timeout = options.timeout;
    this.client.defaults.paramsSerializer = (params) => qs.stringify(params, { arrayFormat: "repeat" });
    axiosRetry(this.client, { retries: options.retries });

    this.client.interceptors.request.use((config) => {
      const token = options.token?.();
      if (token) {
        const headers = config.headers ?? {};
        headers["Authorization"] = `Bearer ${token}`;
        config.headers = headers;
      }
      return config;
    });

    // apis
    this.auth = new AuthApi(this.client);
    this.info = new InfoApi(this.client);
  }
}
