import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import PluginCtx from "./ctx";
import { config } from "../config/config";
import { database } from "../config/database";
import { logger } from "../logger/server";
import { docker } from "../docker/api";
import { events } from "../events";
import { DepkerPlugin } from "./plugin";
import Router from "@koa/router";
import { auth } from "../middleware/auth";

export const plugins = async () => {
  const json = fs.readJsonSync(join(dir.plugins, "package.json"));
  const names = Object.keys(json.dependencies || {});
  const plugins = (await Promise.all(
    names.map((name) => {
      const path = join(dir.plugins, "node_modules", name);
      return import(path);
    })
  )) as DepkerPlugin[];

  const $ctx: PluginCtx = {
    config,
    database,
    dir,
    events,
    docker,
    logger,
  };
  return {
    register: async () => {
      await Promise.all(plugins.map((plugin) => plugin.register?.($ctx)));
    },
    routes: async (router: Router) => {
      plugins.forEach((plugin) => {
        router.post(`/plugin-${plugin.name}`, auth, async (ctx) => {
          if (plugin.routes) {
            await plugin.routes?.($ctx, ctx);
          } else {
            ctx.status = 404;
            ctx.body = {
              message: "Plugin not found!",
            };
          }
        });
      });
    },
  };
};
