export interface MinioConfig {
  readonly username: string;
  readonly password: string;
  port?: number;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
}

export interface SavedMinioConfig extends MinioConfig {
  username: string;
  password: string;
}
