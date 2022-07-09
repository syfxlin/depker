import { posix } from "https://deno.land/std@0.133.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.133.0/fs/mod.ts";

const home = () => {
  let dir: string;
  switch (Deno.build.os) {
    case "windows":
      dir = Deno.env.get("APPDATA") as string;
      if (!dir) {
        throw new Error("%AppData% is not defined");
      }
      break;
    case "darwin":
      dir = Deno.env.get("HOME") as string;
      if (!dir) {
        throw new Error("$HOME is not defined");
      }
      dir = posix.join(dir, "Library", "Application Support");
      break;
    default:
      dir = Deno.env.get("XDG_CONFIG_HOME") as string;
      if (!dir) {
        dir = Deno.env.get("HOME") as string;
        if (!dir) {
          throw new Error("Neither $XDG_CONFIG_HOME nor $HOME are defined");
        }
        dir = posix.join(dir, ".config");
      }
  }
  return dir;
};

const $home = home();
const $base = posix.join($home, "depker");
const $config = posix.join($base, "config");
const $storage = posix.join($base, "storage");
const $tmp = posix.join(".depker", "tmp");

// ensure
ensureDirSync($home);
ensureDirSync($base);
ensureDirSync($config);
ensureDirSync($storage);

export const dir = {
  home: $home,
  base: $base,
  config: $config,
  storage: $storage,
  tmp: $tmp,
};
