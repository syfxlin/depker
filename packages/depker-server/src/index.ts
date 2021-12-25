import { Server } from "socket.io";
import { routes } from "./routes";
import { initDocker } from "./docker/init";
import { plugins as getPlugins } from "./plugins";
import { $logger } from "./logger/server";
import { events } from "./events";

export const io = new Server();

const start = async () => {
  await initDocker();

  $logger.info("Initializing plugins...");
  const plugins = await getPlugins();
  await plugins.register();
  await plugins.routes(io);
  await events.emitAsync("init");

  routes(io);
  io.listen(3000);

  console.log(`Server started, listen port 3000`);
  await events.emitAsync("started");
};

start();
