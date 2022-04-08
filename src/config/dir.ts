import { join } from "https://deno.land/std@0.133.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.133.0/fs/mod.ts";
import homeDir from "https://deno.land/x/dir@v1.2.0/home_dir/mod.ts";

const $homeDir = homeDir() as string;
const $home = Deno.env.get("XDG_CONFIG_HOME") || join($homeDir, ".config");
const $base = join($home, "depker");
const $config = join($base, "config");
const $storage = join($base, "storage");

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
};
