export interface ProxyConfig {
  config: string[];
  ports: number[];
  envs: Record<string, string>;
  labels: Record<string, string>;
}
