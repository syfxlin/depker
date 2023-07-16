export interface ProxyConfig {
  mail?: string;
  provider?: string;
  ports?: string[];
  envs?: Record<string, string>;
  labels?: Record<string, string>;
}
