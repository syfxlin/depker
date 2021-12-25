import { DepkerPlugin } from "@syfxlin/depker-server";
import { join } from "path";
import mysql from "mysql2";
import { RowDataPacket } from "mysql2/typings/mysql/lib/protocol/packets";
import { randomUUID } from "crypto";

export type MysqlPluginConfig = {
  name: string;
  image: string;
  password: string;
};

export const init: DepkerPlugin["init"] = async (ctx) => {
  ctx.logger.info("Initializing MySQL...");

  const config = ctx.config.mysql as MysqlPluginConfig;

  if (!config) {
    ctx.logger.info("No MySQL config, disable mysql plugin");
    return;
  }

  // check mysql
  const containers = await ctx.docker.listContainers({ all: true });
  const mysql = containers.find((container) =>
    container.Names.find((n) => n.startsWith(`/${config.name}`))
  );

  // if mysql container exists, restart
  if (mysql && !mysql.Status.includes("Exited")) {
    ctx.logger.info("MySQL already running. Restarting MySQL...");
    const container = await ctx.docker.getContainer(mysql.Id);
    await container.restart();
    ctx.logger.info("MySQL restart done!");
    return;
  }
  // if mysql container is exited, remove
  if (mysql && mysql.Status.includes("Exited")) {
    ctx.logger.info("Exited MySQL instance found, re-creating ...");
    const container = await ctx.docker.getContainer(mysql.Id);
    await container.remove();
  }

  // pull mysql image
  const images = await ctx.docker.listImages();
  const image = images.find(
    (image) => image.RepoTags && image.RepoTags.includes(config.image)
  );
  if (!image) {
    ctx.logger.info("No MySQL image found, pulling...");
    await ctx.docker.pull(config.image);
  }

  // TODO: remove windows hook
  const dataDir = join(ctx.dir.storage, "mysql")
    .replace(/\\/g, "/")
    .replace(/(\w):/, ($0, $1) => `/mnt/${$1.toLowerCase()}`);

  // create container
  const container = await ctx.docker.createContainer({
    name: config.name,
    Image: config.image,
    Env: [
      `DEPKER_NAME=${config.name}`,
      `DEPKER_ID=${config.name}`,
      `MYSQL_ROOT_PASSWORD=${config.password}`,
    ],
    Labels: {
      "depker.name": config.name,
      "depker.id": config.name,
    },
    ExposedPorts: {
      "3306/tcp": {},
    },
    HostConfig: {
      RestartPolicy: {
        Name: "on-failure",
        MaximumRetryCount: 2,
      },
      Binds: [`/data/depker-mysql:/var/lib/mysql`],
      PortBindings: {
        "3306/tcp": [{ HostPort: "3306" }],
      },
    },
  });

  // connect to depker network
  const network = await ctx.docker.depkerNetwork();
  await network.connect({
    Container: container.id,
  });

  // start container
  await container.start();

  ctx.logger.info("MySQL started!");
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
    const conn = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: config.password,
    });
    try {
      const [databases] = await conn
        .promise()
        .query<RowDataPacket[]>("SHOW DATABASES");
      socket.emit("ok", {
        message: "List mysql database success!",
        databases: databases
          .map((r) => r.Database)
          .filter(
            (db) =>
              ![
                "information_schema",
                "performance_schema",
                "mysql",
                "sys",
              ].includes(db)
          ),
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
    const password = randomUUID().replaceAll("-", "");
    const conn = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: config.password,
    });
    // prettier-ignore
    try {
      await conn.promise().query(`CREATE USER '${name}'@'%' IDENTIFIED BY '${password}'`);
      await conn.promise().query(`FLUSH PRIVILEGES`);
      await conn.promise().query(`CREATE DATABASE \`${name}\``);
      await conn.promise().query(`GRANT ALL PRIVILEGES ON \`${name}\` . * TO '${name}'@'%'`);
      await conn.promise().query(`FLUSH PRIVILEGES`);
      socket.emit("ok", {
        message: "Create mysql database and user success!",
        username: name,
        password: password,
        database: name,
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

  socket.on("mysql:remove", async (name) => {
    const conn = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: config.password,
    });
    // prettier-ignore
    try {
      await conn.promise().query(`DROP DATABASE \`${name}\``);
      await conn.promise().query(`DROP USER \`${name}\``);
      await conn.promise().query(`FLUSH PRIVILEGES`);
      socket.emit("ok", {
        message: "Remove mysql database and user success!"
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
