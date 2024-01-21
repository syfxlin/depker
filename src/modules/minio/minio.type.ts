export interface MinioConfig {
  username: string;
  password: string;
  tls?: boolean;
  domain?: string;
  console?: string;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
}
