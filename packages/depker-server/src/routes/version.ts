import { SocketIOFn } from "../types";
import packageJson from "../../package.json";

export const version: SocketIOFn = (io) => {
  io.of("/version").on("connection", (socket) => {
    socket.emit("ok", {
      message: "Get server version success!",
      version: packageJson.version,
    });
  });
};
