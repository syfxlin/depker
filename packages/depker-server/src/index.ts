import { routes } from "./routes";
import { initDocker } from "./docker/init";
import { plugins as getPlugins } from "./plugins";
import { logger } from "./logger/server";
import { events } from "./events";
import Koa from "koa";
import Router from "@koa/router";
import { error } from "./middleware/error";
import websocket from "koa-easy-ws";
import body from "koa-body";

const app = new Koa();
const router = new Router();

app.use(body());
app.use(error);
app.use(websocket());
app.use(router.routes());
app.use(router.allowedMethods());

const start = async () => {
  await initDocker();

  logger.info("Initializing plugins...");
  const plugins = await getPlugins();
  await plugins.register();
  await plugins.routes(router);
  await events.emitAsync("init");

  routes(router, app);

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server started, listen port 3000");
    events.emitAsync("started");
  });
};

start();
