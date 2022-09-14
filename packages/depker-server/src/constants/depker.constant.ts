import path from "path";

export const DEPKER = "depker";
export const DEPKER_SERVER = `${DEPKER}-server`;
export const DEPKER_TRAEFIK = `${DEPKER}-traefik`;
export const DEPKER_LOGROTATE = `${DEPKER}-logrotate`;
export const DEPKER_NETWORK = DEPKER;
export const DEPKER_CERT = DEPKER;

export const DOCKER_IMAGE = "docker:cli";
export const TRAEFIK_IMAGE = "traefik:latest";
export const LOGROTATE_IMAGE = "vegardit/traefik-logrotate:latest";

export const IN_DOCKER = !!process.env.ROOT_DIR;
export const ROOT_DIR = process.env.ROOT_DIR || path.join(process.cwd(), "storage");
export const LINUX_DIR = (dir: string) => {
  if (process.platform === "win32") {
    dir = dir.replace(/^([a-zA-Z]):/, (s: string, a: string) => `/mnt/${a.toLowerCase()}`);
    dir = dir.replace(/\\/g, "/");
    return dir;
  } else {
    return dir;
  }
};
