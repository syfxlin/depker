import * as fs from "https://deno.land/std@0.133.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.133.0/path/mod.ts";
import * as streams from "https://deno.land/std@0.133.0/streams/mod.ts";
import * as yaml from "https://deno.land/std@0.133.0/encoding/yaml.ts";
import * as toml from "https://deno.land/std@0.133.0/encoding/toml.ts";
import * as base64 from "https://deno.land/std@0.133.0/encoding/base64.ts";
import * as io from "https://deno.land/std@0.133.0/io/mod.ts";
import * as dotenv from "https://deno.land/std@0.133.0/dotenv/mod.ts";
import * as colors from "https://deno.land/x/nanocolors@0.1.12/mod.ts";
import { deepmerge as merge } from "https://deno.land/x/deepmergets@v4.0.3/dist/deno/mod.ts";
import clone from "../utils/clone.ts";
import ky from "https://cdn.skypack.dev/ky@0.30.0?dts";

import { cli, logger } from "../index.ts";
import { dir } from "../core/dir.ts";
import { events } from "../core/events.ts";

const json = JSON;
const uuid = () => crypto.randomUUID();

export {
  fs,
  path,
  streams,
  yaml,
  toml,
  json,
  base64,
  uuid,
  io,
  dotenv,
  colors,
  merge,
  clone,
  ky,
  cli,
  logger,
  dir,
  events,
};
