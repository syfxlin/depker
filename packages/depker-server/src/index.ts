import { Server } from "socket.io";
import { routes } from "./routes";
import { initDocker } from "./docker/init";
import { plugins as getPlugins } from "./plugins";
import { $logger } from "./logger/server";

export const io = new Server();

const start = async () => {
  await initDocker();

  $logger.info("Initializing plugins...");
  const plugins = await getPlugins();
  await plugins.init();
  await plugins.routes(io);

  routes(io);
  io.listen(3000);

  console.log(`Server started, listen port 3000`);
  await plugins.started();
};

start();
