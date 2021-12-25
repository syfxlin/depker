import Ctx from "./ctx";
import { templates as getTemplates } from "../templates";
import { DepkerTemplate } from "../templates/template";
import { PassThrough } from "stream";
import { extract } from "tar-fs";
import fs from "fs-extra";
import { join } from "path";
import { readYml } from "../utils/yml";
import { ClientConfig } from "../config/config";
import { events } from "../events";

export const unpack = (folder: string, stream: NodeJS.ReadableStream) => {
  return new Promise<void>((resolve, reject) => {
    const pass = new PassThrough();
    stream.pipe(pass);
    const pipe = pass.pipe(extract(folder));
    pipe.on("finish", () => resolve());
    pipe.on("error", (e) => reject(e));
  });
};

export const store = (target: string, stream: NodeJS.ReadableStream) => {
  return new Promise<void>((resolve, reject) => {
    const pass = new PassThrough();
    stream.pipe(pass);
    const output = fs.createWriteStream(target);
    pass.pipe(output);
    pass.on("end", () => resolve());
    pass.on("error", (e) => reject(e));
  });
};

export const readConfig = (folder: string) => {
  const rConfig = join(folder, "depker.yml");
  const sConfig = join(folder, ".depker", "depker.yml");
  return readYml<ClientConfig>(fs.pathExistsSync(rConfig) ? rConfig : sConfig);
};

export const deploy = async (ctx: Ctx) => {
  events.emit("pre-deploy", ctx);

  // find template
  const templates = await getTemplates();
  let template: DepkerTemplate | undefined;
  if (ctx.config.template) {
    ctx.$logger.debug(
      `Looking up template from config: ${ctx.config.template}`
    );
    ctx.logger.verbose(
      `Looking up template from config: ${ctx.config.template}`
    );
    template = templates.find((t) => t.name === ctx.config.template);
  } else {
    for (const t of templates) {
      if (await t.check(ctx)) {
        template = t;
        break;
      }
    }
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
  await template.execute(ctx);

  ctx.$logger.debug(`Application deployed: ${ctx.config.name}`);
  ctx.logger.info(`Application deployed: ${ctx.config.name}`);

  events.emit("post-deploy", ctx);
};
