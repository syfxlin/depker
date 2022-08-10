import {
  camelCase,
  constantCase,
  pascalCase,
  snakeCase,
} from "https://deno.land/x/case@2.1.1/mod.ts";
import {
  isAbsolute,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.133.0/path/mod.ts";
import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";
import { logger } from "../index.ts";
import { events } from "./events.ts";
import { dir } from "./dir.ts";

export const task = async (location: string, name: string) => {
  if (!isAbsolute(location)) {
    location = resolve(location);
  }
  const url = toFileUrl(location);
  let mod = await import(url.toString());
  for (const path of name.split(":")) {
    if (mod !== undefined && mod !== null) {
      // prettier-ignore
      mod = mod[camelCase(path)] ?? mod[snakeCase(path)] ?? mod[pascalCase(path)] ?? mod[constantCase(path)];
    }
  }
  return mod;
};

export const pipeline = async (
  name: string,
  args: string[],
  options: Record<string, any>
) => {
  try {
    // env
    const env = Object.assign(
      {},
      await config({ path: options.envFile }),
      Object.fromEntries(options.env.map((e: string) => e.split("=")))
    );
    for (const key in env) {
      if (Deno.env.get(key) !== undefined) {
        continue;
      }
      Deno.env.set(key, env[key]);
    }

    // chdir
    Deno.chdir(options.project);
    // ensure temp dir
    Deno.mkdirSync(dir.tmp, { recursive: true });

    // run task
    logger.step(`Running task: ${name}`);
    const fn = await task(options.config, name);
    if (!fn) {
      throw new Error("Task not found!");
    }
    await events.emit("init");
    await fn({ args, options });
    await events.emit("destroy");
    logger.success(`Successfully run task: ${name}`);
  } finally {
    try {
      // clear temp dir
      Deno.removeSync(dir.tmp, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
};
