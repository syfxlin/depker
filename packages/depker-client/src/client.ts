import axios, { AxiosInstance } from "axios";
import qs from "qs";
import axiosRetry from "axios-retry";
import { AuthApi } from "./api/auth.api";
import { SystemApi } from "./api/system.api";
import { AppApi } from "./api/app.api";
import { BuildpackApi } from "./api/buildpack.api";
import { PortApi } from "./api/port.api";
import { VolumeApi } from "./api/volume.api";
import { AssetApi } from "./api/asset.api";
import { DeployApi } from "./api/deploy.api";

export interface DepkerClientOptions {
  endpoint: string;
  timeout?: number;
  retries?: number;
  token?: () => string | null | undefined;
  client?: (endpoint: string) => AxiosInstance | null | undefined;
}

export class DepkerClient {
  public readonly endpoint: string;
  public readonly token: () => string | null | undefined;
  public readonly request: AxiosInstance;
  public readonly auth: AuthApi;
  public readonly system: SystemApi;
  public readonly app: AppApi;
  public readonly buildpack: BuildpackApi;
  public readonly port: PortApi;
  public readonly volume: VolumeApi;
  public readonly asset: AssetApi;
  public readonly deploy: DeployApi;

  constructor(options: DepkerClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token ?? (() => undefined);
    this.request = options.client?.(options.endpoint) ?? axios.create({ baseURL: options.endpoint });
    this.request.defaults.timeout = options.timeout;
    this.request.defaults.paramsSerializer = (params) => qs.stringify(params, { arrayFormat: "brackets" });
    axiosRetry(this.request as any, { retries: options.retries });

    this.request.interceptors.request.use((config) => {
      const token = options.token?.();
      if (token) {
        const headers = config.headers ?? {};
        headers["Authorization"] = `Bearer ${token}`;
        config.headers = headers;
      }
      return config;
    });

    // apis
    this.auth = new AuthApi(this);
    this.system = new SystemApi(this);
    this.app = new AppApi(this);
    this.buildpack = new BuildpackApi(this);
    this.port = new PortApi(this);
    this.volume = new VolumeApi(this);
    this.asset = new AssetApi(this);
    this.deploy = new DeployApi(this);
  }
}
