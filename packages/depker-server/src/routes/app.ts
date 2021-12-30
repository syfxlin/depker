import { KoaFn } from "../types";
import { docker } from "../docker/api";
import { logger } from "../logger/server";
import { auth } from "../middleware/auth";

export const app: KoaFn = (router) => {
  // list apps
  router.get("/apps", auth, async (ctx) => {
    const state = ctx.query.state ?? "all";
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
      ctx.status = 200;
      ctx.body = {
        message: "List apps success!",
        apps: infos,
      };
    } catch (e) {
      const error = e as Error;
      logger.error(`List app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "List apps error!",
        error: error.message,
      };
    }
  });
  // app info
  router.get("/apps/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (info) {
        ctx.status = 200;
        ctx.body = {
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
                `${mount.Source}:${mount.Destination}/${mount.RW ? "rw" : "ro"}`
            ),
          },
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
      }
    } catch (e) {
      const error = e as Error;
      logger.error(`Fetch app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Fetch app info error!",
        error: error.message,
      };
    }
  });
  // remove app
  router.delete("/apps/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    const force = ctx.query.force === "true";
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (info) {
        const container = await docker.getContainer(info.Id);
        await container.remove({ force });
        ctx.body = {
          message: "App remove success!",
        };
      } else {
        ctx.body = {
          message: "App does not exist!",
        };
      }
      ctx.status = 200;
    } catch (e) {
      const error = e as Error;
      logger.error(`Remove app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Remove app error!",
        error: error.message,
      };
    }
  });
  // restart app
  router.post("/apps/:name/restart", auth, async (ctx) => {
    const name = ctx.params.name;
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (info) {
        const container = await docker.getContainer(info.Id);
        await container.restart();
        ctx.status = 200;
        ctx.body = {
          message: "App restart success!",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
      }
    } catch (e) {
      const error = e as Error;
      logger.error(`Restart app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Restart app error!",
        error: error.message,
      };
    }
  });
  // start app
  router.post("/apps/:name/start", auth, async (ctx) => {
    const name = ctx.params.name;
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (info) {
        const container = await docker.getContainer(info.Id);
        await container.start();
        ctx.status = 200;
        ctx.body = {
          message: "App start success!",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
      }
    } catch (e) {
      const error = e as Error;
      logger.error(`Start app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Start app error!",
        error: error.message,
      };
    }
  });
  // stop app
  router.post("/apps/:name/stop", auth, async (ctx) => {
    const name = ctx.params.name;
    try {
      const containers = await docker.listContainers({ all: true });
      const info = containers.find((c) => c.Labels["depker.name"] === name);
      if (info) {
        const container = await docker.getContainer(info.Id);
        await container.stop();
        ctx.status = 200;
        ctx.body = {
          message: "App stop success!",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          message: "App does not exist!",
        };
      }
    } catch (e) {
      const error = e as Error;
      logger.error(`Stop app error: ${error.message}`);
      ctx.status = 500;
      ctx.body = {
        message: "Stop app error!",
        error: error.message,
      };
    }
  });
};
