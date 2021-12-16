import { SocketIOFn } from "../types";
import { extract } from "tar-fs";
import rimraf from "rimraf";
import { join } from "path";
import { dir } from "../config/dir";
import { randomUUID } from "crypto";
import { readYml } from "../utils/yml";
import { ClientConfig } from "../config/config";
import Ctx from "../docker/ctx";
import { templates as getTemplates } from "../templates";
import DepkerTemplate from "../templates/template";
// @ts-ignore
import ss from "@sap_oss/node-socketio-stream";

const unpack = (folder: string, stream: NodeJS.ReadableStream) => {
  return new Promise<void>((resolve, reject) => {
    const pipe = stream.pipe(extract(folder));
    pipe.on("finish", () => resolve());
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

  ctx.$logger.debug(`Deploy success: ${ctx.config.name}`);
};

export const deploy: SocketIOFn = (io) => {
  io.of("/deploy").on("connection", (socket) => {
    ss(socket).on("deploy", async (stream: NodeJS.ReadableStream) => {
      // temp deploy folder
      const folder = join(dir.deploying, randomUUID());
      // unpack project
      await unpack(folder, stream);
      // config
      const config = readYml<ClientConfig>(join(folder, "depker.yml"));
      // ctx
      const ctx = new Ctx({
        folder,
        config,
        socket,
      });

      // deploy
      try {
        await $deploy(ctx);
      } finally {
        await rm(folder);
        socket.emit("end");
      }
    });
  });
};
