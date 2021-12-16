import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import { database } from "../config/database";

export const secret: SocketIOFn = (io) => {
  io.of("/secrets")
    .use(auth)
    .on("connection", (socket) => {
      // list secrets
      socket.on("list", () => {
        const secrets = database.getCollection("secrets").data;
        socket.emit("ok", {
          message: "List secrets success!",
          secrets,
        });
      });
      // add
      socket.on("add", (name: string, value: string) => {
        if (!name || !value) {
          socket.emit("error", {
            message: "No name or value given!",
          });
          return;
        }
        const collection = database.getCollection("secrets");
        if (collection.findOne({ name })) {
          socket.emit("error", {
            message: "Secret already exists!",
          });
          return;
        }
        collection.insert({ name, value });
        socket.emit("ok", {
          message: "Add secret success!",
          name,
          value,
        });
      });
      // remove
      socket.on("remove", (name: string) => {
        if (!name) {
          socket.emit("error", {
            message: "No name given!",
          });
          return;
        }
        const collection = database.getCollection("secrets");
        const secret = collection.findOne({ name });
        if (!secret) {
          socket.emit("ok", {
            message: "Secret does not exist!",
          });
          return;
        }
        collection.remove(secret);
        socket.emit("ok", {
          message: "Secret remove success!",
        });
      });
    });
};
