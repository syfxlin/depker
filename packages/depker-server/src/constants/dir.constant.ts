import path from "path";

export const WORK_DIR = process.cwd();
export const BASE_DIR = path.join(WORK_DIR, "storage");

export const LINUX_DIR = (dir: string) => {
  dir = dir.replace(/^([a-zA-Z]):/, (s: string, a: string) => `/mnt/${a.toLowerCase()}`);
  dir = dir.replace(/\\/g, "/");
  return dir;
};
