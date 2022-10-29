import axios, { AxiosInstance } from "axios";
import qs from "qs";
import axiosRetry from "axios-retry";
import { AuthApi } from "./api/auth.api";
import { SystemApi } from "./api/system.api";
import { AppApi } from "./api/app.api";
import { BuildpackApi } from "./api/buildpack.api";
import { PortApi } from "./api/port.api";
import { VolumeApi } from "./api/volume.api";

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
  public readonly system: SystemApi;
  public readonly app: AppApi;
  public readonly buildpack: BuildpackApi;
  public readonly port: PortApi;
  public readonly volume: VolumeApi;

  constructor(options: DepkerClientOptions) {
    this.client = options.client?.(options.endpoint) ?? axios.create({ baseURL: options.endpoint });
    this.client.defaults.timeout = options.timeout;
    this.client.defaults.paramsSerializer = (params) => qs.stringify(params, { arrayFormat: "brackets" });
    axiosRetry(this.client as any, { retries: options.retries });

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
    this.system = new SystemApi(this.client);
    this.app = new AppApi(this.client);
    this.buildpack = new BuildpackApi(this.client);
    this.port = new PortApi(this.client);
    this.volume = new VolumeApi(this.client);
  }
}
