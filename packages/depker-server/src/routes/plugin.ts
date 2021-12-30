import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import { spawn } from "child_process";
import { KoaFn } from "../types";
import { auth } from "../middleware/auth";

export const plugin: KoaFn = (router) => {
  // list
  router.get("/plugins", auth, async (ctx) => {
    const json = await fs.readJson(join(dir.plugins, "package.json"));
    const plugins = Object.keys(json.dependencies || {});
    ctx.status = 200;
    ctx.body = {
      message: "List plugins success!",
      plugins,
    };
  });
  // add
  router.post("/plugins/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install", name],
      { cwd: dir.plugins }
    );
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        if (code === 0) {
          ctx.status = 200;
          ctx.body = {
            message: `Add plugin ${name} success!`,
          };
        } else {
          ctx.status = 500;
          ctx.body = {
            message: `Add plugin ${name} error!`,
          };
        }
        resolve();
      });
    });
  });
  // remove
  router.delete("/plugins/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["uninstall", name],
      { cwd: dir.plugins }
    );
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        if (code === 0) {
          ctx.status = 200;
          ctx.body = {
            message: `Remove plugin ${name} success!`,
          };
        } else {
          ctx.status = 500;
          ctx.body = {
            message: `Remove plugin ${name} error!`,
          };
        }
        resolve();
      });
    });
  });
};
