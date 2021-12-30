import type { Ctx, DepkerPlugin } from "@syfxlin/depker-server";
import { initContainer } from "./docker";
import { create, list, remove } from "./pgsql";

export type PgsqlPluginConfig = {
  name: string;
  image: string;
  password: string;
};

export const name: DepkerPlugin["name"] = "mysql";

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

export const routes: DepkerPlugin["routes"] = async (ctx, koa) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;

  if (!config) {
    koa.status = 500;
    koa.body = {
      message: "PostgreSQL plugin not enable, your must set pgsql config",
    };
    return;
  }

  const command = koa.request.body.command;

  // list
  if (command === "list") {
    try {
      const data = await list(ctx);
      if (!data) {
        koa.status = 500;
        koa.body = {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        };
        return;
      }
      koa.status = 200;
      koa.body = {
        message: "List pgsql database success!",
        databases: data,
      };
    } catch (e) {
      const error = e as Error;
      koa.status = 500;
      koa.body = {
        message: "Connect pgsql error!",
        error: error.message,
      };
    }
    return;
  }

  // create
  if (command === "create") {
    const [name] = koa.request.body.args as string[];
    try {
      const data = await create(name, ctx);
      if (!data) {
        koa.status = 500;
        koa.body = {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        };
        return;
      }
      koa.status = 200;
      koa.body = {
        message: "Create pgsql database and user success!",
        ...data,
      };
    } catch (e) {
      const error = e as Error;
      koa.status = 500;
      koa.body = {
        message: "Connect pgsql error!",
        error: error.message,
      };
    }
    return;
  }

  // remove
  if (command === "remove") {
    const [name] = koa.request.body.args as string[];
    try {
      const data = await remove(name, ctx);
      if (!data) {
        koa.status = 500;
        koa.body = {
          message: "PostgreSQL plugin not enable, your must set pgsql config",
        };
        return;
      }
      koa.status = 200;
      koa.body = {
        message: "Remove pgsql database and user success!",
      };
    } catch (e) {
      const error = e as Error;
      koa.status = 500;
      koa.body = {
        message: "Connect pgsql error!",
        error: error.message,
      };
    }
    return;
  }
};
