export const IS_WIN = process.platform === "win32";
export const IS_DEV = process.env.NODE_ENV === "development";

export const NAMES = {
  DEPKER: "depker",
  CONFIG: "depker-config",
  TRAEFIK: "depker-traefik",
  LOGROTATE: "depker-logrotate",
};

export const IMAGES = {
  CONFIG: "syfxlin/depker-config:latest",
  TRAEFIK: "traefik:latest",
  LOGROTATE: "vegardit/traefik-logrotate:latest",
};

export const VOLUMES = {
  CONFIG: NAMES.CONFIG,
  TRAEFIK: NAMES.CONFIG,
  LOGROTATE: NAMES.CONFIG,
};

export const LINUX_PATH = (dir: string) => {
  if (IS_WIN) {
    dir = dir.replace(/^([a-zA-Z]):/, (s: string, a: string) => `/mnt/${a.toLowerCase()}`);
    dir = dir.replace(/\\/g, "/");
    return dir;
  } else {
    return dir;
  }
};
