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
import { FilesApi } from "./api/files.api";
import { TokenApi } from "./api/token.api";

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
  public readonly auths: AuthApi;
  public readonly systems: SystemApi;
  public readonly apps: AppApi;
  public readonly buildpacks: BuildpackApi;
  public readonly ports: PortApi;
  public readonly volumes: VolumeApi;
  public readonly assets: AssetApi;
  public readonly deploys: DeployApi;
  public readonly files: FilesApi;
  public readonly tokens: TokenApi;

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
    this.auths = new AuthApi(this);
    this.systems = new SystemApi(this);
    this.apps = new AppApi(this);
    this.buildpacks = new BuildpackApi(this);
    this.ports = new PortApi(this);
    this.volumes = new VolumeApi(this);
    this.assets = new AssetApi(this);
    this.deploys = new DeployApi(this);
    this.files = new FilesApi(this);
    this.tokens = new TokenApi(this);
  }
}
