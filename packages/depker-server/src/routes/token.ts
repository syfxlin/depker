import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import { database } from "../config/database";
import { randomUUID } from "crypto";

export const token: SocketIOFn = (io) => {
  io.of("/tokens")
    .use(auth)
    .on("connection", (socket) => {
      // list tokens
      socket.on("list", () => {
        socket.emit("ok", {
          message: "List tokens success!",
          tokens: database.getCollection("tokens").data,
        });
      });
      // add token
      socket.on("add", (name: string) => {
        if (!name) {
          socket.emit("error", {
            message: "No name given!",
          });
          return;
        }
        const token = randomUUID();
        const collection = database.getCollection("tokens");
        if (collection.findOne({ name })) {
          socket.emit("error", {
            message: "Token already exists!",
          });
          return;
        }
        collection.insert({ name, token });
        socket.emit("ok", {
          message: "Add token success!",
          name,
          token,
        });
      });
      // remove token
      socket.on("remove", (name: string) => {
        if (!name) {
          socket.emit("error", {
            message: "No name given!",
          });
          return;
        }
        const tokens = database.getCollection("tokens");
        const token = tokens.findOne({ name });
        if (!token) {
          socket.emit("ok", {
            message: "Token does not exist!",
          });
          return;
        }
        tokens.remove(token);
        socket.emit("ok", {
          message: "Token remove success!",
        });
      });
    });
};
