import * as fs from "https://deno.land/std@0.211.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.211.0/path/mod.ts";
import * as yaml from "https://deno.land/std@0.211.0/yaml/mod.ts";
import * as dotenv from "https://deno.land/std@0.211.0/dotenv/mod.ts";
import ignore from "https://esm.sh/v128/ignore@5.2.4/deno/ignore.mjs";
import nunjucks from "https://deno.land/x/nunjucks@3.2.4/mod.js";

export { fs, path, yaml, dotenv, ignore, nunjucks };
export { osType } from "https://deno.land/std@0.211.0/path/_os.ts";
export { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/mod.ts";
export { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";
export { deepMerge } from "https://deno.land/std@0.211.0/collections/mod.ts";
export { Command, EnumType } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
export { Table } from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";
export { EventEmitter } from "https://deno.land/x/event@2.0.1/mod.ts";
export { build$, CommandBuilder, RequestBuilder } from "https://deno.land/x/dax@0.36.0/mod.ts";
export { isSubdir } from "https://deno.land/std@0.211.0/fs/_is_subdir.ts";
export { toPathString } from "https://deno.land/std@0.211.0/fs/_to_path_string.ts";
export { getFileInfoType } from "https://deno.land/std@0.211.0/fs/_get_file_info_type.ts";
export type { $BuiltInProperties } from "https://deno.land/x/dax@0.36.0/mod.ts";

declare module "https://deno.land/x/dax@0.36.0/mod.ts" {
  // @ts-ignore
  import { CommandBuilder as CB, RequestBuilder as RB } from "https://deno.land/x/dax@0.36.0/mod.ts";

  // @ts-ignore
  interface CommandBuilder extends CB {
    jsonl<T = any>(): Promise<T>;
  }

  // @ts-ignore
  interface RequestBuilder extends RB {
    jsonl<T = any>(): Promise<T>;
  }
}
