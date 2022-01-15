import { join } from "path";
import { PgsqlPluginConfig } from "./index";
import { PluginCtx } from "@syfxlin/depker-server";

export const initContainer = async (ctx: PluginCtx) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;

  // check pgsql
  const containers = await ctx.docker.listContainers({ all: true });
  const pgsql = containers.find((container) =>
    container.Names.find((n) => n.startsWith(`/${config.name}`))
  );

  // if pgsql container exists, restart
  if (pgsql && !pgsql.Status.includes("Exited")) {
    ctx.logger.info("PostgreSQL already running. Restarting PostgreSQL...");
    const container = await ctx.docker.getContainer(pgsql.Id);
    await container.restart();
    ctx.logger.info("PostgreSQL restart done!");
    return;
  }
  // if pgsql container is exited, remove
  if (pgsql && pgsql.Status.includes("Exited")) {
    ctx.logger.info("Exited PostgreSQL instance found, re-creating ...");
    const container = await ctx.docker.getContainer(pgsql.Id);
    await container.remove();
  }

  // pull pgsql image
  const images = await ctx.docker.listImages();
  const image = images.find(
    (image) => image.RepoTags && image.RepoTags.includes(config.image)
  );
  if (!image) {
    ctx.logger.info("No PostgreSQL image found, pulling...");
    await ctx.docker.pullImage(config.image);
  }

  // TODO: remove windows hook
  const dataDir = join(ctx.dir.storage, "pgsql")
    .replace(/\\/g, "/")
    .replace(/(\w):/, ($0, $1) => `/mnt/${$1.toLowerCase()}`);

  // create container
  const container = await ctx.docker.createContainer({
    name: config.name,
    Image: config.image,
    Env: [
      `DEPKER_NAME=${config.name}`,
      `DEPKER_ID=${config.name}`,
      `POSTGRES_PASSWORD=${config.password}`,
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
      Binds: [`${dataDir}:/var/lib/postgresql/data`],
      PortBindings: {
        "5432/tcp": [{ HostPort: "5432" }],
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

  ctx.logger.info("PostgreSQL started!");
};
