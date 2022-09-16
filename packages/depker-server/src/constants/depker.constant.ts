import path from "path";
import fs from "fs-extra";
import { spawnSync } from "child_process";

export const AUTH_SECRET = "AUTH_SECRET";

export const IS_WIN = process.platform === "win32";
export const IS_DOCKER = !!process.env.ROOT_DIR;
export const IS_DEV = process.env.NODE_ENV === "development";
export const ROOT_DIR = process.env.ROOT_DIR || path.join(process.cwd(), "..", "storage");

export const NAMES = {
  DEPKER: "depker",
  SERVER: "depker-server",
  TRAEFIK: "depker-traefik",
  LOGROTATE: "depker-logrotate",
  NETWORK: "depker",
  CERTIFICATE: "depker",
};

export const IMAGES = {
  DOCKER: "docker:cli",
  TRAEFIK: "traefik:latest",
  LOGROTATE: "vegardit/traefik-logrotate:latest",
};

export const URLS = {
  TRAEFIK: `http://${NAMES.TRAEFIK}:8080`,
};

export const PATHS = {
  IN_DOCKER: IS_DOCKER,
  ROOT: ROOT_DIR,
  CONFIG: path.join(ROOT_DIR, "config"),
  REPOS: path.join(ROOT_DIR, "repos"),
  VOLUMES: path.join(ROOT_DIR, "volumes"),
  PLUGINS: path.join(ROOT_DIR, "plugins"),
  LINUX: (dir: string) => {
    if (IS_WIN) {
      dir = dir.replace(/^([a-zA-Z]):/, (s: string, a: string) => `/mnt/${a.toLowerCase()}`);
      dir = dir.replace(/\\/g, "/");
      return dir;
    } else {
      return dir;
    }
  },
};

fs.ensureDirSync(PATHS.ROOT);
fs.ensureDirSync(PATHS.CONFIG);
fs.ensureDirSync(PATHS.REPOS);
fs.ensureDirSync(PATHS.VOLUMES);
fs.ensureDirSync(PATHS.PLUGINS);
if (!fs.pathExistsSync(path.join(PATHS.PLUGINS, "package.json"))) {
  spawnSync(IS_WIN ? "npm.cmd" : "npm", ["init", "-y", "--silent"], { cwd: PATHS.PLUGINS });
}
