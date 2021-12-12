import { randomUUID } from "crypto";
import { hashSync } from "bcrypt";
import fs from "fs-extra";
import { dir } from "./dir";
import { readYml, writeYml } from "../utils/yml";

export interface ServerConfig {
  name: string;
  secret: string;
  token: string;
  gzip: boolean;
  autoprune: boolean;
  network: string;
  domain: string | false;
  traefik: {
    name: string;
    image: string;
    ports?: string[];
    env?: Record<string, string>;
    labels?: Record<string, string>;
  };
}

export interface ClientConfig {
  // 部署名称，用于区别不同的应用
  name: string;
  // 模板，如果未设置，则自动识别
  template?: string;
  // 主要反代端口
  port?: number;
  // 域名
  domain?: string | string[];
  // 连接的网络
  network?: string[];
  // 重启策略
  restart?:
    | "no"
    | "on-failure"
    | "unless-stopped"
    | "always"
    | `on-failure:${string}`;
  // 是否启用 gzip 压缩
  gzip?: boolean;
  // 是否启用 LE 证书
  letsencrypt?: boolean;
  // 端口
  ports?: string[];
  // 环境变量
  env?: Record<string, string>;
  // 挂载
  volumes?: string[];
  // 标记
  labels?: Record<string, string>;
  // traefik 配置
  // traefik 中间件
  middlewares?: string[];
  // 访问限制
  rateLimit?: {
    // 时间段
    average: number;
    // 最大突发
    burst: number;
  };
  // 授权
  basicAuth?: string;
  // 其他选项
  [key: string]: any;
}

const defaultConfig: ServerConfig = {
  name: "depker-server",
  secret: randomUUID().replace(/-/g, ""),
  token: hashSync("token", 10),
  gzip: true,
  autoprune: false,
  network: "depker",
  domain: false,
  traefik: {
    name: "depker-traefik",
    image: "traefik:latest",
  },
};

const ensureConfig = () => {
  if (!fs.pathExistsSync(dir.config)) {
    writeYml(dir.config, defaultConfig);
  }
};
ensureConfig();

export const config = readYml<ServerConfig>(dir.config);
