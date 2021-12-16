import { SocketIOFn } from "../types";
import { compareSync } from "bcrypt";
import { config } from "../config/config";
import { auth, sign } from "../io/auth";
import { database } from "../config/database";
import { randomUUID } from "crypto";

export const login: SocketIOFn = (io) => {
  io.of("/login").on("connection", (socket) => {
    // normal login
    socket.on("login", (token: string) => {
      if (!token) {
        socket.emit("error", {
          message: "No signature given!",
        });
        return;
      }
      if (!compareSync(token, config.token)) {
        socket.emit("error", {
          message: "Not authorized!",
        });
        return;
      }
      const jwt = sign();
      socket.emit("ok", {
        message: "Login success!",
        token: jwt,
      });
    });
    // token login
    socket.on("token", (token: string) => {
      if (!token) {
        socket.emit("error", {
          message: "No signature given!",
        });
        return;
      }
      const one = database.getCollection("tokens").findOne({ token });
      if (!one) {
        socket.emit("error", {
          message: "Not authorized!",
        });
        return;
      }
      const jwt = sign();
      socket.emit("ok", {
        message: "Login success!",
        token: jwt,
      });
    });
  });
};

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
