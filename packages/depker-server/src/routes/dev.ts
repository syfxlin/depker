import { KoaFn } from "../types";
import { auth } from "../middleware/auth";
import { docker } from "../docker/api";
import { logger } from "../logger/server";
import { responseStream } from "../middleware/stream";

export const dev: KoaFn = (router) => {
  // exec
  // ss(socket).on(
  //   "exec",
  //   async (
  //     name: string,
  //     command: string[],
  //     stdin: NodeJS.ReadableStream,
  //     stdout: NodeJS.WritableStream
  //   ) => {
  //     try {
  //       const containers = await docker.listContainers({ all: true });
  //       const info = containers.find(
  //         (c) => c.Labels["depker.name"] === name
  //       );
  //       if (!info) {
  //         socket.emit("error", {
  //           message: "App does not exist!",
  //         });
  //         return;
  //       }
  //       const container = await docker.getContainer(info.Id);
  //       const exec = await container.exec({
  //         AttachStdin: true,
  //         AttachStdout: true,
  //         AttachStderr: true,
  //         Tty: true,
  //         Cmd: command,
  //         DetachKeys: "ctrl-q",
  //       });
  //       const duplex = await exec.start({
  //         stdin: true,
  //       });
  //       duplex.pipe(stdout);
  //       stdin.pipe(duplex);
  //       // exit
  //       duplex.on("end", () => {
  //         socket.emit("exit");
  //       });
  //       // error
  //       duplex.on("error", (err) => {
  //         $logger.error(`Exec container error: ${err.message}`);
  //         socket.emit("error", {
  //           message: "Exec container error!",
  //           error: err.message,
  //         });
  //       });
  //     } catch (e) {
  //       const error = e as Error;
  //       $logger.error(`Exec container error: ${error.message}`);
  //       socket.emit("error", {
  //         message: "Exec container error!",
  //         error: error.message,
  //       });
  //     }
  //   }
  // );
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
