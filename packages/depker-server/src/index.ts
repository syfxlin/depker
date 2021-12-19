import { Server } from "socket.io";
import { routes } from "./routes";
import { initDocker } from "./docker/init";

export const io = new Server();

const start = async () => {
  await initDocker();

  routes(io);

  io.listen(3000);

  console.log(`Server started!`);
};

start();
