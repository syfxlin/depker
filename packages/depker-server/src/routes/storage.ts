import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import fs from "fs-extra";
import { dir } from "../config/dir";
import { basename, join } from "path";

export const storage: SocketIOFn = (io) => {
  io.of("/storages")
    .use(auth)
    .on("connection", (socket) => {
      // list
      socket.on("list", async () => {
        const storages = await fs.readdir(dir.storage);
        socket.emit("ok", {
          message: "List storages success!",
          storages: storages.map((s) => basename(s)),
        });
      });
      // add
      socket.on("add", async (name) => {
        const path = join(dir.storage, name);
        await fs.ensureDir(path);
        socket.emit("ok", {
          message: "Add storage success!",
          name,
          path,
        });
      });
      // remove
      socket.on("remove", async (name) => {
        await fs.remove(join(dir.storage, name));
        socket.emit("ok", {
          message: "Remove storage success!",
        });
      });
    });
};
