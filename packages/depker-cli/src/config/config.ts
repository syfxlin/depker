import fs from "fs-extra";
import { readYml, writeYml } from "@syfxlin/depker-client";
import { dir } from "./dir";

export type CliConfig = {
  // depker-server 地址
  endpoint: string;
  // 登录后存储的 jwt 令牌
  token?: string;
};

const defaultConfig: CliConfig = {
  endpoint: "http://localhost:3000",
};

const ensureConfig = () => {
  if (!fs.pathExistsSync(dir.config)) {
    writeYml(dir.config, defaultConfig);
  }
};
ensureConfig();

export let config = readYml<CliConfig>(dir.config);

export const updateConfig = ($config: Partial<CliConfig>) => {
  config = {
    ...config,
    ...$config,
  };
  writeYml(dir.config, config);
  return config;
};
