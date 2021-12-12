import { join } from "path";
import { homedir } from "os";
import fs from "fs-extra";
import { spawn } from "child_process";

const $home = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const $base = join($home, "depker");
const $traefik = join($base, "traefik");
const $extensions = join($base, "extensions");
const $deploying = join($base, "deploying");
const $storage = join($base, "storage");
const $config = join($base, "server.config.yml");
const $database = join($base, "database.json");

const ensurePath = () => {
  // ensure base dir
  fs.ensureDirSync($base);
  // ensure extensions
  fs.ensureDirSync($extensions);
  // ensure deploying
  fs.ensureDirSync($deploying);
  // ensure traefik
  fs.ensureDirSync($traefik);
  // ensure storage
  fs.ensureDirSync($storage);

  // ensure extensions package.json
  if (!fs.pathExistsSync(join($extensions, "package.json"))) {
    spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["init", "-y", "--silent"],
      { cwd: $extensions }
    );
  }
};
ensurePath();

export const dir = {
  base: $base,
  extensions: $extensions,
  deploying: $deploying,
  config: $config,
  database: $database,
  traefik: $traefik,
  storage: $storage,
};
