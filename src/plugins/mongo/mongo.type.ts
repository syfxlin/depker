export interface MongoConfig {
  readonly username: string;
  readonly password: string;
  port?: number;
  envs?: Record<string, string>;
  labels?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
}

export interface SavedMongoConfig extends MongoConfig {
  username: string;
  password: string;
}
