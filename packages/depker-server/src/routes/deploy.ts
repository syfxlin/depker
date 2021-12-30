import { KoaFn } from "../types";
import { join } from "path";
import { dir } from "../config/dir";
import { deploy as $deploy, readConfig, store, unpack } from "../docker/deploy";
import fs from "fs-extra";
import Ctx from "../docker/ctx";
import { log } from "../logger/client";
import { requestStream, responseStream } from "../middleware/stream";
import { auth } from "../middleware/auth";

export const deploy: KoaFn = (router) => {
  router.post("/deploy", auth, async (ctx) => {
    const input = requestStream(ctx);
    const output = responseStream(ctx, true);

    const id = Date.now();
    const folder = join(dir.deploying, `deploy-${id}`);
    const tar = join(dir.deploying, `deploy-${id}.tar`);

    // unpack project
    await Promise.all([unpack(folder, input), store(tar, input)]);

    // config
    const config = readConfig(folder);

    // ctx
    const $ctx = new Ctx({
      folder,
      config,
      logger: log(output),
    });

    $ctx.$logger.debug(`Deploying with name: ${config.name}`);
    $ctx.logger.info(`Deploying with name: ${config.name}`);

    // deploy
    try {
      await $deploy($ctx);

      // store history
      await fs.move(tar, join(dir.histories, `${config.name}.tar`), {
        overwrite: true,
      });
    } catch (e) {
      const error = e as Error;
      ctx.$logger.error(`Deploy error with name: ${config.name}`, {
        error: error.message,
      });
      ctx.logger.error(`Deploy error with name: ${config.name}`, {
        error: error.message,
      });
    } finally {
      await fs.remove(folder);
      await fs.remove(tar);
      output.end();
    }
  });
};
