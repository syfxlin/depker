import { KoaFn } from "../types";
import { auth } from "../middleware/auth";
import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import { spawn } from "child_process";

export const template: KoaFn = (router) => {
  // list
  router.get("/templates", auth, async (ctx) => {
    const json = await fs.readJson(join(dir.templates, "package.json"));
    const templates = Object.keys(json.dependencies || {});
    ctx.status = 200;
    ctx.body = {
      message: "List templates success!",
      templates,
    };
  });
  // add
  router.post("/templates/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install", name],
      { cwd: dir.templates }
    );
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        if (code === 0) {
          ctx.status = 200;
          ctx.body = {
            message: `Add template ${name} success!`,
          };
        } else {
          ctx.status = 500;
          ctx.body = {
            message: `Add template ${name} error!`,
          };
        }
        resolve();
      });
    });
  });
  // remove
  router.delete("/templates/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["uninstall", name],
      { cwd: dir.templates }
    );
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        if (code === 0) {
          ctx.status = 200;
          ctx.body = {
            message: `Remove template ${name} success!`,
          };
        } else {
          ctx.status = 500;
          ctx.body = {
            message: `Remove template ${name} error!`,
          };
        }
        resolve();
      });
    });
  });
};
