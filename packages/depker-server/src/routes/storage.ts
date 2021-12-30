import { KoaFn } from "../types";
import { auth } from "../middleware/auth";
import fs from "fs-extra";
import { dir } from "../config/dir";
import { basename, join } from "path";

export const storage: KoaFn = (router) => {
  // list
  router.get("/storages", auth, async (ctx) => {
    const storages = await fs.readdir(dir.storage);
    ctx.status = 200;
    ctx.body = {
      message: "List storages success!",
      storages: storages.map((s) => basename(s)),
    };
  });
  // add
  router.post("/storages/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const path = join(dir.storage, name);
    await fs.ensureDir(path);
    ctx.status = 200;
    ctx.body = {
      message: "Add storage success!",
      name,
      path,
    };
  });
  // remove
  router.delete("/storages/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    await fs.remove(join(dir.storage, name));
    ctx.status = 200;
    ctx.body = {
      message: "Remove storage success!",
    };
  });
};
