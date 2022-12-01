import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import qs from "qs";
import axiosRetry from "axios-retry";
import { AuthApi } from "./api/auth.api";
import { SystemApi } from "./api/system.api";
import { ServiceApi } from "./api/service.api";
import { BuildpackApi } from "./api/buildpack.api";
import { PortApi } from "./api/port.api";
import { VolumeApi } from "./api/volume.api";
import { AssetApi } from "./api/asset.api";
import { DeployApi } from "./api/deploy.api";
import { FilesApi } from "./api/files.api";
import { TokenApi } from "./api/token.api";
import { io, ManagerOptions, Socket } from "socket.io-client";
import { SettingApi } from "./api/setting.api";

export interface DepkerClientOptions {
  endpoint: string;
  timeout?: number;
  retries?: number;
  token?: () => string | null | undefined;
  client?: () => AxiosRequestConfig;
  socket?: () => Partial<ManagerOptions>;
}

export class DepkerClient {
  public readonly endpoint: string;
  public readonly token: () => string | null | undefined;
  public readonly client: AxiosInstance;
  public readonly socket: (nsp: string, params?: Record<string, any>) => Socket;

  // apis
  public readonly auths: AuthApi;
  public readonly systems: SystemApi;
  public readonly services: ServiceApi;
  public readonly buildpacks: BuildpackApi;
  public readonly ports: PortApi;
  public readonly volumes: VolumeApi;
  public readonly assets: AssetApi;
  public readonly deploys: DeployApi;
  public readonly files: FilesApi;
  public readonly tokens: TokenApi;
  public readonly settings: SettingApi;

  constructor(options: DepkerClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token ?? (() => undefined);

    // http client
    this.client = axios.create({ baseURL: options.endpoint, ...options.client?.() });
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

    // socket.io client
    this.socket = (nsp, params) => {
      const url = new URL(nsp, options.endpoint).toString();
      const opts = {
        ...options.socket?.(),
        auth: {
          _token: options.token?.(),
          ...params,
        },
      };
      return io(url, opts);
    };

    // apis
    this.auths = new AuthApi(this);
    this.systems = new SystemApi(this);
    this.services = new ServiceApi(this);
    this.buildpacks = new BuildpackApi(this);
    this.ports = new PortApi(this);
    this.volumes = new VolumeApi(this);
    this.assets = new AssetApi(this);
    this.deploys = new DeployApi(this);
    this.files = new FilesApi(this);
    this.tokens = new TokenApi(this);
    this.settings = new SettingApi(this);
  }
}
