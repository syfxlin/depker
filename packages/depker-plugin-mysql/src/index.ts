import type { Ctx, DepkerPlugin } from "@syfxlin/depker-server";
import { initContainer } from "./docker";
import { create, list, remove } from "./mysql";

export type MysqlPluginConfig = {
  name: string;
  image: string;
  password: string;
};

export const register: DepkerPlugin["register"] = async (ctx) => {
  ctx.logger.info("Initializing MySQL plugin...");
  const config = ctx.config.mysql as MysqlPluginConfig;

  if (!config) {
    ctx.logger.info("No MySQL config, disable mysql plugin");
    return;
  }

  // init container
  await initContainer(ctx);

  // set deploy listener
  ctx.events.on("pre-deploy", async (c: Ctx) => {
    const config = ctx.config.mysql as MysqlPluginConfig;
    const name = c.config.mysql as string;
    if (!name || !config) {
      return;
    }

    c.logger.info(
      `Found the user-configured database ${name}, creating or skip(if created)`
    );

    // prettier-ignore
    try {
      const data = await create(name, ctx) as { username: string, password: string, database: string };
      c.logger.info(`Create or skip database success, username: ${data.username}, password: ${data.password}, database: ${data.database}`);
    } catch (e) {
      const error = e as Error;
      c.logger.error(`Connect mysql error!`, {
        error: error.message,
      })
    }
  });
};

export const routes: DepkerPlugin["routes"] = async (socket, ctx) => {
  const config = ctx.config.mysql as MysqlPluginConfig;

  if (!config) {
    socket.emit("error", {
      message: "MySQL plugin not enable, your must set mysql config",
    });
    return;
  }

  socket.on("mysql:list", async () => {
    try {
      const data = await list(ctx);
      if (!data) {
        socket.emit("error", {
          message: "MySQL plugin not enable, your must set mysql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "List mysql database success!",
        databases: data,
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect mysql error!",
        error: error.message,
      });
      return;
    }
  });

  socket.on("mysql:create", async (name) => {
    try {
      const data = await create(name, ctx);
      if (!data) {
        socket.emit("error", {
          message: "MySQL plugin not enable, your must set mysql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "Create mysql database and user success!",
        ...data,
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect mysql error!",
        error: error.message,
      });
    }
  });

  socket.on("mysql:remove", async (name) => {
    try {
      const data = await remove(name, ctx);
      if (!data) {
        socket.emit("error", {
          message: "MySQL plugin not enable, your must set mysql config",
        });
        return;
      }
      socket.emit("ok", {
        message: "Remove mysql database and user success!",
      });
    } catch (e) {
      const error = e as Error;
      socket.emit("error", {
        message: "Connect mysql error!",
        error: error.message,
      });
      return;
    }
  });
};
