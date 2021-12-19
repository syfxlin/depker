import { SocketIOFn } from "../types";
import { $logger } from "../logger/server";
// @ts-ignore
import ss from "@sap_oss/node-socketio-stream";
import { docker } from "../docker/api";
import { auth } from "../io/auth";
import { Readable } from "stream";

export const dev: SocketIOFn = (io) => {
  io.of("/dev")
    .use(auth)
    .on("connection", (socket) => {
      // exec
      ss(socket).on(
        "exec",
        async (
          name: string,
          command: string[],
          stdin: NodeJS.ReadableStream,
          stdout: NodeJS.WritableStream
        ) => {
          try {
            const containers = await docker.listContainers({ all: true });
            const info = containers.find(
              (c) => c.Labels["depker.name"] === name
            );
            if (!info) {
              socket.emit("error", {
                message: "App does not exist!",
              });
              return;
            }
            const container = await docker.getContainer(info.Id);
            const exec = await container.exec({
              AttachStdin: true,
              AttachStdout: true,
              AttachStderr: true,
              Tty: true,
              Cmd: command,
              DetachKeys: "ctrl-q",
            });
            const duplex = await exec.start({
              stdin: true,
            });
            duplex.pipe(stdout);
            stdin.pipe(duplex);
            // exit
            duplex.on("end", () => {
              socket.emit("exit");
            });
            // error
            duplex.on("error", (err) => {
              $logger.error(`Exec container error: ${err.message}`);
              socket.emit("error", {
                message: "Exec container error!",
                error: err.message,
              });
            });
          } catch (e) {
            const error = e as Error;
            $logger.error(`Exec container error: ${error.message}`);
            socket.emit("error", {
              message: "Exec container error!",
              error: error.message,
            });
          }
        }
      );
      // logs
      socket.on("logs", async (name: string, follow?: boolean) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (!info) {
            socket.emit("error", {
              message: "App does not exist!",
            });
            return;
          }
          const container = await docker.getContainer(info.Id);
          const logs = await container.logs({
            follow: !!follow,
            stdout: true,
            stderr: true,
          });
          const stream = ss.createStream();
          ss(socket).emit(
            "ok",
            {
              message: "Fetch container logs success!",
            },
            stream
          );
          if (follow) {
            logs.pipe(stream);
          } else {
            const readable = new Readable();
            readable.push(logs);
            readable.push(null);
            readable.pipe(stream);
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Fetch container logs error: ${error.message}`);
          socket.emit("error", {
            message: "Fetch container logs error!",
            error: error.message,
          });
        }
      });
      // prune
      socket.on("prune", async () => {
        try {
          await Promise.all([docker.pruneImages(), docker.pruneVolumes()]);
          socket.emit("ok", {
            message: "Prune docker success!",
          });
        } catch (e) {
          const error = e as Error;
          $logger.error(`Prune docker error: ${error.message}`);
          socket.emit("error", {
            message: "Prune docker error!",
            error: error.message,
          });
        }
      });
    });
};
