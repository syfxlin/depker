import { FastifyFn } from "../types";
import { IncomingMessage } from "http";
import { randomUUID } from "crypto";
import { extract } from "tar-fs";
import { join } from "path";
import { dir } from "../config/dir";
import { ClientConfig } from "../config/config";
import highland from "highland";
import { Readable } from "stream";
import rimraf from "rimraf";
import { readYml } from "../utils/yml";
import Ctx from "../docker/ctx";
import { templates as getTemplates } from "../templates";
import DepkerTemplate from "../templates/template";

const unpack = (folder: string, stream: IncomingMessage) => {
  return new Promise((resolve, reject) => {
    const pipe = stream.pipe(extract(folder));
    pipe.on("finish", () => resolve(undefined));
    pipe.on("error", (e) => reject(e));
  });
};

const rm = (folder: string) => {
  return new Promise((resolve) => rimraf(folder, resolve));
};

const $deploy = async (ctx: Ctx) => {
  // find template
  const templates = await getTemplates(ctx);
  let template: DepkerTemplate | undefined;
  if (ctx.config.template) {
    ctx.$logger.debug(
      `Looking up template from config: ${ctx.config.template}`
    );
    template = templates.find((t) => t.name === ctx.config.template);
  } else {
    template = templates.find((t) => t.check());
  }

  // template not found
  if (!template) {
    ctx.$logger.debug(`Build failed! Couldn't find template!`);
    ctx.logger.error(`Build failed! Couldn't find template!`);
    return;
  }

  ctx.$logger.debug(`Using template: ${template.name}`);
  ctx.logger.info(`Using template: ${template.name}`);

  // execute template
  await template.execute();
};

export const deploy: FastifyFn = (fastify) => {
  // deploy
  fastify.post(
    "/deploy",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      // temp deploy folder
      const folder = join(dir.deploying, randomUUID());
      // response
      const stream = highland();

      // unpack project
      await unpack(folder, request.raw);
      // config
      const config = readYml<ClientConfig>(join(folder, "depker.yml"));

      // ctx
      const ctx = new Ctx({
        folder,
        config,
        stream,
      });

      // deploy
      $deploy(ctx)
        .catch((error) => {
          ctx.logger.error(`Deploy error!`, error);
        })
        .finally(() => ctx.end());

      // prepare
      // @ts-ignore
      const response = new Readable().wrap(stream);
      reply.send(response);
      response.on("end", async () => {
        await rm(folder);
      });
    }
  );
};
