import { SocketIOFn } from "../types";
import { join } from "path";
import { dir } from "../config/dir";
import Ctx from "../docker/ctx";
// @ts-ignore
import ss from "@sap_oss/node-socketio-stream";
import fs from "fs-extra";
import { auth } from "../io/auth";
import { deploy as $deploy, readConfig, store, unpack } from "../docker/deploy";

export const deploy: SocketIOFn = (io) => {
  io.of("/deploy")
    .use(auth)
    .on("connection", (socket) => {
      // deploy
      ss(socket).on("deploy", async (stream: NodeJS.ReadableStream) => {
        // deploy folder and tar
        const id = Date.now();
        const folder = join(dir.deploying, `deploy-${id}`);
        const tar = join(dir.deploying, `deploy-${id}.tar`);
        // unpack project
        await Promise.all([unpack(folder, stream), store(tar, stream)]);
        // config
        const config = readConfig(folder);
        // ctx
        const ctx = new Ctx({
          folder,
          config,
          socket,
        });

        // log
        ctx.$logger.debug(`Deploying with name: ${config.name}`);
        ctx.logger.info(`Deploying with name: ${config.name}`);

        // deploy
        try {
          await $deploy(ctx);

          // store history
          await fs.move(tar, join(dir.histories, `${config.name}.tar`));
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
          socket.emit("end");
        }
      });
    });
};
