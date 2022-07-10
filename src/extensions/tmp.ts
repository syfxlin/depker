import * as fs from "https://deno.land/std@0.133.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.133.0/path/mod.ts";
import { dir as $dir } from "../core/dir.ts";

export const file = (prefix: string, content?: string) => {
  // write tmp file
  const file = path.posix.join($dir.tmp, `${prefix}-${crypto.randomUUID()}`);
  fs.ensureFileSync(file);
  Deno.writeTextFileSync(file, content ?? "");
  return file;
};

export const dir = (prefix: string) => {
  // make tmp dir
  const dir = path.posix.join($dir.tmp, `${prefix}-${crypto.randomUUID()}`);
  fs.ensureDirSync(dir);
  return dir;
};
