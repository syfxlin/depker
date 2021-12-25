import type { Ctx, DepkerPlugin } from "@syfxlin/depker-server";
import { initContainer } from "./docker";
import { create, list, remove } from "./pgsql";

export type PgsqlPluginConfig = {
  name: string;
  image: string;
  password: string;
};

export const register: DepkerPlugin["register"] = async (ctx) => {
  ctx.logger.info("Initializing PostgreSQL plugin...");
  const config = ctx.config.pgsql as PgsqlPluginConfig;

  if (!config) {
    ctx.logger.info("No PostgreSQL config, disable pgsql plugin");
    return;
  }

  // init container
  await initContainer(ctx);

  // set deploy listener
  ctx.events.on("pre-deploy", async (c: Ctx) => {
    const config = ctx.config.pgsql as PgsqlPluginConfig;
    const name = c.config.pgsql as string;
    if (!name || !config) {
      return;
    }

    c.logger.info(
      `Found the user-configured pgsql ${name}, creating or skip(if created)`
    );

    // prettier-ignore
    try {
      const data = await create(name, ctx) as any as { username: string, password: string, database: string };
      c.logger.info(`Create or skip database success, username: ${data.username}, password: ${data.password}, database: ${data.database}`);
    } catch (e) {
      const error = e as Error;
      c.logger.error(`Connect pgsql error!`, {
        error: error.message,
      })
    }
  });
};

export const routes: DepkerPlugin["routes"] = async (socket, ctx) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;

  if (!config) {
    socket.emit("error", {
      message: "PostgreSQL plugin not enable, your must set pgsql config",
    });
    return;
  }

  socket.on("pgsql:list", async () => {
    try {
      const data = await list(ctx);
      if (!data) {
        socket.emit("error", {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "List pgsql database success!",
        databases: data,
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect pgsql error!",
        error: error.message,
      });
      return;
    }
  });

  socket.on("pgsql:create", async (name) => {
    try {
      const data = await create(name, ctx);
      if (!data) {
        socket.emit("error", {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "Create pgsql database and user success!",
        ...data,
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect pgsql error!",
        error: error.message,
      });
    }
  });

  socket.on("pgsql:remove", async (name) => {
    try {
      const data = await remove(name, ctx);
      if (!data) {
        socket.emit("error", {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "Remove pgsql database and user success!",
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect pgsql error!",
        error: error.message,
      });
      return;
    }
  });
};
