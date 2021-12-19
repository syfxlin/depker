import { SocketIOFn } from "../types";
import { auth } from "../io/auth";
import { docker } from "../docker/api";
import { $logger } from "../logger/server";

export const app: SocketIOFn = (io) => {
  io.of("/apps")
    .use(auth)
    .on("connection", (socket) => {
      // list apps
      socket.on("list", async (state) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const infos = containers
            .filter((c) => {
              if (!c.Labels["depker.name"]) {
                return false;
              }
              if (state === "all") {
                return true;
              }
              return c.State === state;
            })
            .map((c) => ({
              id: c.Id,
              name: c.Labels["depker.name"],
              container: c.Names.join(","),
              created: c.Created,
              status: c.Status,
              state: c.State,
            }));
          socket.emit("ok", {
            message: "List apps success!",
            apps: infos,
          });
        } catch (e) {
          const error = e as Error;
          $logger.error(`List app error: ${error.message}`);
          socket.emit("error", {
            message: "List apps error!",
            error: error.message,
          });
        }
      });
      // remove app
      socket.on("remove", async (name, force) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (info) {
            const container = await docker.getContainer(info.Id);
            await container.remove({ force: !!force });
            socket.emit("ok", {
              message: "App remove success!",
            });
          } else {
            socket.emit("ok", {
              message: "App does not exist!",
            });
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Remove app error: ${error.message}`);
          socket.emit("error", {
            message: "Remove app error!",
            error: error.message,
          });
        }
      });
      // restart app
      socket.on("restart", async (name) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (info) {
            const container = await docker.getContainer(info.Id);
            await container.restart();
            socket.emit("ok", {
              message: "App restart success!",
            });
          } else {
            socket.emit("error", {
              message: "App does not exist!",
            });
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Restart app error: ${error.message}`);
          socket.emit("error", {
            message: "Restart app error!",
            error: error.message,
          });
        }
      });
      // start app
      socket.on("start", async (name) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (info) {
            const container = await docker.getContainer(info.Id);
            await container.start();
            socket.emit("ok", {
              message: "App start success!",
            });
          } else {
            socket.emit("error", {
              message: "App does not exist!",
            });
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Start app error: ${error.message}`);
          socket.emit("error", {
            message: "Start app error!",
            error: error.message,
          });
        }
      });
      // stop app
      socket.on("stop", async (name) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (info) {
            const container = await docker.getContainer(info.Id);
            await container.stop();
            socket.emit("ok", {
              message: "App stop success!",
            });
          } else {
            socket.emit("error", {
              message: "App does not exist!",
            });
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Stop app error: ${error.message}`);
          socket.emit("error", {
            message: "Stop app error!",
            error: error.message,
          });
        }
      });
      socket.on("info", async (name) => {
        try {
          const containers = await docker.listContainers({ all: true });
          const info = containers.find((c) => c.Labels["depker.name"] === name);
          if (info) {
            socket.emit("ok", {
              message: "Fetch app info success!",
              info: {
                id: info.Id,
                name,
                container: info.Names.join(","),
                image: info.Image,
                command: info.Command,
                created: info.Created,
                ports: info.Ports.map((port) => {
                  let str = "";
                  if (port.IP) {
                    str += `${port.IP}:`;
                  }
                  if (port.PublicPort) {
                    str += `${port.PublicPort}:`;
                  }
                  str += port.PrivatePort;
                  if (port.Type) {
                    str += `/${port.Type}`;
                  }
                  return str;
                }),
                labels: Object.entries(info.Labels).map(
                  ([key, value]) => `${key}=${value}`
                ),
                state: info.State,
                status: info.Status,
                networks: Object.keys(info.NetworkSettings.Networks),
                networkMode: info.HostConfig.NetworkMode,
                mounts: info.Mounts.map(
                  (mount) =>
                    `${mount.Source}:${mount.Destination}/${
                      mount.RW ? "rw" : "ro"
                    }`
                ),
              },
            });
          } else {
            socket.emit("error", {
              message: "App does not exist!",
            });
          }
        } catch (e) {
          const error = e as Error;
          $logger.error(`Fetch app error: ${error.message}`);
          socket.emit("error", {
            message: "Fetch app info error!",
            error: error.message,
          });
        }
      });
    });
};
