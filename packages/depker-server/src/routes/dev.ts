import { KoaFn } from "../types";
import { auth } from "../middleware/auth";
import { docker } from "../docker/api";
import { logger } from "../logger/server";
import { responseStream } from "../middleware/stream";
import { createWebSocketStream } from "ws";

export const dev: KoaFn = (router) => {
  // exec
  router.get("/exec/:name", async (ctx) => {
    const name = ctx.params.name;
    const command = ctx.query.command as string[];
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (!info) {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
        return;
      }

      if (!ctx.ws) {
        ctx.status = 405;
        ctx.body = {
          message: "Exec container must use websocket connect",
        };
        return;
      }
      const ws = await ctx.ws();
      const stdio = createWebSocketStream(ws, { encoding: "binary" });

      const container = await docker.getContainer(info.Id);
      const exec = await container.exec({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: command ?? ["sh"],
        DetachKeys: "ctrl-q",
      });
      const duplex = await exec.start({
        stdin: true,
      });

      stdio.pipe(duplex);
      duplex.pipe(stdio);
    } catch (e: any) {
      const error = e as Error;
      logger.error(`Exec container error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Exec container error!",
        error: error.message,
      };
    }
  });
  // logs
  router.get("/logs/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const follow = ctx.query.follow === "true";
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (!info) {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
        return;
      }
      const container = await docker.getContainer(info.Id);
      const logs = await container.logs({
        follow,
        stdout: true,
        stderr: true,
      });
      const output = responseStream(ctx);
      if (follow) {
        logs.pipe(output);
      } else {
        output.write(logs);
        output.end();
      }
    } catch (e) {
      const error = e as Error;
      logger.error(`Fetch container logs error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Fetch container logs error!",
        error: error.message,
      };
    }
  });
  // prune
  router.post("/prune", auth, async (ctx) => {
    try {
      await Promise.all([docker.pruneImages(), docker.pruneVolumes()]);
      ctx.status = 200;
      ctx.body = {
        message: "Prune docker success!",
      };
    } catch (e) {
      const error = e as Error;
      logger.error(`Prune docker error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Prune docker error!",
        error: error.message,
      };
    }
  });
};
