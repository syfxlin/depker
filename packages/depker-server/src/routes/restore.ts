import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import { join } from "path";
import { dir } from "../config/dir";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { deploy as $deploy, readConfig, unpack } from "../docker/deploy";
import Ctx from "../docker/ctx";
import { Socket } from "socket.io";

const $restore = async (name: string, socket: Socket) => {
  const tar = join(dir.histories, `${name}.tar`);
  if (!(await fs.pathExists(tar))) {
    socket.emit("error", {
      message: `App ${name} not found!`,
    });
    return;
  }
  // folder
  const folder = join(dir.deploying, `deploy-${randomUUID()}`);
  // unpack
  await unpack(folder, fs.createReadStream(tar));
  // config
  const config = readConfig(folder);
  // ctx
  const ctx = new Ctx({
    folder,
    config,
    socket,
  });

  // log
  ctx.$logger.debug(`Restoring with name: ${config.name}`);
  ctx.logger.info(`Restoring with name: ${config.name}`);

  // deploy
  try {
    await $deploy(ctx);
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
  }
};

export const restore: SocketIOFn = (io) => {
  io.of("/restore")
    .use(auth)
    .on("connection", (socket) => {
      // restore
      socket.on("restore", async (name: string) => {
        try {
          await $restore(name, socket);
        } finally {
          socket.emit("end");
        }
      });
      // restore all
      socket.on("all", async () => {
        const tars = await fs.readdir(dir.histories);
        try {
          for (const tar of tars) {
            await $restore(tar.replace(".tar", ""), socket);
          }
        } finally {
          socket.emit("end");
        }
      });
    });
};
