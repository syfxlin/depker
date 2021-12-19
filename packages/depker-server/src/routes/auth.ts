import { SocketIOFn } from "../types";
import { compareSync } from "bcrypt";
import { config } from "../config/config";
import { sign } from "../io/auth";
import { database } from "../config/database";

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
