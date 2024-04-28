import * as fs from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as dax from "https://deno.land/x/dax@0.36.0/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import * as yaml from "https://deno.land/std@0.224.0/yaml/mod.ts";
import * as date from "https://deno.land/x/ptera@v1.0.2/mod.ts";
import * as ansi from "https://deno.land/x/cliffy@v0.25.7/ansi/mod.ts";
import * as table from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";
import * as event from "https://deno.land/x/event@2.0.1/mod.ts";
import * as dotenv from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import * as prompt from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import * as command from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as collections from "https://deno.land/std@0.224.0/collections/mod.ts";
import hash from "https://deno.land/x/object_hash@2.0.3.1/mod.ts";
import ignore from "https://esm.sh/v128/ignore@5.2.4/deno/ignore.mjs";
import nunjucks from "https://deno.land/x/nunjucks@3.2.4/mod.js";

export { fs, dax, path, yaml, hash, date, ansi, table, event, dotenv, prompt, command, ignore, nunjucks, collections };
export { isSubdir } from "https://deno.land/std@0.224.0/fs/_is_subdir.ts";
export { toPathString } from "https://deno.land/std@0.224.0/fs/_to_path_string.ts";
export { getFileInfoType } from "https://deno.land/std@0.224.0/fs/_get_file_info_type.ts";
export { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.1.0/mod.ts";

declare module "https://deno.land/x/dax@0.36.0/mod.ts" {
  // @ts-expect-error
  import { CommandBuilder as CB, RequestBuilder as RB } from "https://deno.land/x/dax@0.36.0/mod.ts";

  // @ts-expect-error
  interface CommandBuilder extends CB {
    jsonl<T = any>(): Promise<T>;
  }

  // @ts-expect-error
  interface RequestBuilder extends RB {
    jsonl<T = any>(): Promise<T>;
  }
}
