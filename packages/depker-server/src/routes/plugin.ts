import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import { spawn } from "child_process";

export const plugin: SocketIOFn = (io) => {
  io.of("/plugins")
    .use(auth)
    .on("connection", (socket) => {
      // list
      socket.on("list", async () => {
        const json = await fs.readJson(join(dir.plugins, "package.json"));
        const plugins = Object.keys(json.dependencies || {});
        socket.emit("ok", {
          message: "List plugins success!",
          plugins,
        });
      });
      // add
      socket.on("add", (name) => {
        const child = spawn(
          process.platform === "win32" ? "npm.cmd" : "npm",
          ["install", name],
          { cwd: dir.plugins }
        );
        child.on("close", (code) => {
          if (code === 0) {
            socket.emit("ok", {
              message: `Add plugin ${name} success!`,
            });
          } else {
            socket.emit("error", {
              message: `Add plugin ${name} error!`,
            });
          }
        });
      });
      // remove
      socket.on("remove", async (name) => {
        const child = spawn(
          process.platform === "win32" ? "npm.cmd" : "npm",
          ["uninstall", name],
          { cwd: dir.plugins }
        );
        child.on("close", (code) => {
          if (code === 0) {
            socket.emit("ok", {
              message: `Remove plugin ${name} success!`,
            });
          } else {
            socket.emit("error", {
              message: `Remove plugin ${name} error!`,
            });
          }
        });
      });
    });
};
