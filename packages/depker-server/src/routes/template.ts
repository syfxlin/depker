import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import { spawn } from "child_process";

export const template: SocketIOFn = (io) => {
  io.of("/templates")
    .use(auth)
    .on("connection", (socket) => {
      // list
      socket.on("list", async () => {
        const json = await fs.readJson(join(dir.templates, "package.json"));
        const templates = Object.keys(json.dependencies || {});
        socket.emit("ok", {
          message: "List templates success!",
          templates,
        });
      });
      // add
      socket.on("add", (name) => {
        const child = spawn(
          process.platform === "win32" ? "npm.cmd" : "npm",
          ["install", name],
          { cwd: dir.templates }
        );
        child.on("close", (code) => {
          if (code === 0) {
            socket.emit("ok", {
              message: `Add template ${name} success!`,
            });
          } else {
            socket.emit("error", {
              message: `Add template ${name} error!`,
            });
          }
        });
      });
      // remove
      socket.on("remove", async (name) => {
        const child = spawn(
          process.platform === "win32" ? "npm.cmd" : "npm",
          ["uninstall", name],
          { cwd: dir.templates }
        );
        child.on("close", (code) => {
          if (code === 0) {
            socket.emit("ok", {
              message: `Remove template ${name} success!`,
            });
          } else {
            socket.emit("error", {
              message: `Remove template ${name} error!`,
            });
          }
        });
      });
    });
};
