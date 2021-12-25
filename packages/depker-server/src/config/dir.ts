import { join } from "path";
import { homedir } from "os";
import fs from "fs-extra";
import { spawn } from "child_process";

const $home = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const $base = join($home, "depker");
const $traefik = join($base, "traefik");
const $templates = join($base, "templates");
const $plugins = join($base, "plugins");
const $deploying = join($base, "deploying");
const $histories = join($base, "histories");
const $storage = join($base, "storage");
const $config = join($base, "server.config.yml");
const $database = join($base, "database.json");

const ensureDir = () => {
  // ensure base dir
  fs.ensureDirSync($base);
  // ensure templates
  fs.ensureDirSync($templates);
  // ensure plugins
  fs.ensureDirSync($plugins);
  // ensure deploying
  fs.ensureDirSync($deploying);
  // ensure traefik
  fs.ensureDirSync($traefik);
  // ensure storage
  fs.ensureDirSync($storage);
  // ensure histories
  fs.ensureDirSync($histories);

  // ensure templates package.json
  if (!fs.pathExistsSync(join($templates, "package.json"))) {
    spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["init", "-y", "--silent"],
      { cwd: $templates }
    );
  }

  // ensure plugins package.json
  if (!fs.pathExistsSync(join($plugins, "package.json"))) {
    spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["init", "-y", "--silent"],
      { cwd: $plugins }
    );
  }
};
ensureDir();

export const dir = {
  base: $base,
  templates: $templates,
  plugins: $plugins,
  deploying: $deploying,
  config: $config,
  database: $database,
  traefik: $traefik,
  storage: $storage,
  histories: $histories,
};
