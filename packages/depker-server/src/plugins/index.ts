import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import PluginCtx from "./ctx";
import { config } from "../config/config";
import { database } from "../config/database";
import { $logger } from "../logger/server";
import { docker } from "../docker/api";
import { events } from "../events";
import { DepkerPlugin } from "./plugin";
import { Server } from "socket.io";
import { auth } from "../io/auth";

export const plugins = async () => {
  const json = fs.readJsonSync(join(dir.plugins, "package.json"));
  const names = Object.keys(json.dependencies || {});
  const plugins = (await Promise.all(
    names.map((name) => {
      const path = join(dir.plugins, "node_modules", name);
      return import(path);
    })
  )) as DepkerPlugin[];

  const ctx: PluginCtx = {
    config,
    database,
    dir,
    events,
    docker,
    logger: $logger,
  };
  return {
    register: async () => {
      await Promise.all(plugins.map((plugin) => plugin.register?.(ctx)));
    },
    routes: async (io: Server) => {
      io.of("/plugin")
        .use(auth)
        .on("connection", async (socket) => {
          try {
            await Promise.all(
              plugins.map((plugin) => plugin.routes?.(socket, ctx))
            );
          } catch (e) {
            const error = e as Error;
            $logger.error(`List app error: ${error.message}`);
            socket.emit("error", {
              message: "Operate plugin error!",
              error: error.message,
            });
          }
        });
    },
  };
};
