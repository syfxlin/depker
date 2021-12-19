import { join } from "path";
import { homedir } from "os";
import fs from "fs-extra";

const $home = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const $base = join($home, "depker");
const $config = join($base, "cli.config.yml");
const $deploying = join($base, "deploying");

const ensureDir = () => {
  // ensure base
  fs.ensureDirSync($base);
  // ensure deploying
  fs.ensureDirSync($deploying);
};
ensureDir();

export const dir = {
  home: $home,
  base: $base,
  config: $config,
  deploying: $deploying,
};
