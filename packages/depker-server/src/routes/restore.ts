import { KoaFn } from "../types";
import { join } from "path";
import { dir } from "../config/dir";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { deploy as $deploy, readConfig, unpack } from "../docker/deploy";
import Ctx from "../docker/ctx";
import { log } from "../logger/client";
import { responseStream } from "../middleware/stream";
import { Writable } from "stream";
import { auth } from "../middleware/auth";

const $restore = async (name: string, output: Writable) => {
  const tar = join(dir.histories, `${name}.tar`);
  // folder
  const folder = join(dir.deploying, `deploy-${randomUUID()}`);
  // unpack
  await unpack(folder, fs.createReadStream(tar));
  // config
  const config = readConfig(folder);
  // ctx
  const $ctx = new Ctx({
    folder,
    config,
    logger: log(output),
  });

  // log
  $ctx.$logger.debug(`Restoring with name: ${config.name}`);
  $ctx.logger.info(`Restoring with name: ${config.name}`);

  // deploy
  try {
    await $deploy($ctx);
  } catch (e) {
    const error = e as Error;
    $ctx.$logger.error(`Deploy error with name: ${config.name}`, {
      error: error.message,
    });
    $ctx.logger.error(`Deploy error with name: ${config.name}`, {
      error: error.message,
    });
  } finally {
    await fs.remove(folder);
  }
};

export const restore: KoaFn = (router) => {
  router.post("/restore/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const output = responseStream(ctx, true);
    try {
      if (name === "all") {
        const tars = await fs.readdir(dir.histories);
        for (const tar of tars) {
          await $restore(tar.replace(".tar", ""), output);
        }
      } else {
        if (!(await fs.pathExists(join(dir.histories, `${name}.tar`)))) {
          ctx.status = 404;
          ctx.body = {
            message: `App ${name} not found!`,
          };
          return;
        }
        await $restore(name, output);
      }
    } finally {
      output.end();
    }
  });
};
