import { join } from "path";
import { MysqlPluginConfig } from "./index";
import { PluginCtx } from "@syfxlin/depker-server";

export const initContainer = async (ctx: PluginCtx) => {
  const config = ctx.config.mysql as MysqlPluginConfig;

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
      Binds: [`${dataDir}:/var/lib/mysql`],
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
