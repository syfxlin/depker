import fs from "fs-extra";
import { dir } from "../config/dir";
import { fastify } from "../index";
import { docker } from "./api";
import { config } from "../config/config";
import { join } from "path";
import { depkerNetwork } from "./network";
import { writeYml } from "../utils/yml";
import { secret } from "../config/database";

const defaultConfig = {
  log: {
    level: "warning",
    filePath: "/var/traefik/traefik.log",
  },
  entryPoints: {
    web: {
      address: ":80",
    },
  },
  providers: {
    docker: {
      endpoint: "unix:///var/run/docker.sock",
      exposedByDefault: false,
    },
  },
};

const ensureConfig = () => {
  const config = join(dir.traefik, "traefik.yml");
  if (!fs.pathExistsSync(config)) {
    writeYml(config, defaultConfig);
  }
};

export const initTraefik = async () => {
  fastify.log.info("Initializing traefik...");
  // init config
  ensureConfig();

  // find exists traefik container
  const containers = await docker.listContainers({ all: true });
  const traefik = containers.find((container) =>
    container.Names.find((n) => n.startsWith(`/${config.traefik.name}`))
  );

  // if traefik container exists, restart
  if (traefik && !traefik.Status.includes("Exited")) {
    fastify.log.info("Traefik already running. Restarting traefik...");
    const container = await docker.getContainer(traefik.Id);
    await container.restart();
    fastify.log.info("Traefik restart done!");
    return;
  }
  // if traefik container is exited, remove
  if (traefik && traefik.Status.includes("Exited")) {
    fastify.log.info("Exited traefik instance found, re-creating ...");
    const container = await docker.getContainer(traefik.Id);
    await container.remove();
  }

  // pull traefik image
  const images = await docker.listImages();
  const image = images.find(
    (image) => image.RepoTags && image.RepoTags.includes(config.traefik.image)
  );
  if (!image) {
    fastify.log.info("No traefik image found, pulling...");
    await docker.pull(config.traefik.image);
  }

  const server = containers.find((container) =>
    container.Names.find((n) => n.startsWith(`/${config.name}`))
  );
  // TODO: remove windows hook
  let traefikDir = dir.traefik
    .replace(/\\/g, "/")
    .replace(/(\w):/, ($0, $1) => `/mnt/${$1.toLowerCase()}`);
  if (server) {
    fastify.log.info("depker-server is running inside docker.");
    const baseDir = server.Mounts.find((v) => v.Destination === dir.base);
    if (baseDir) {
      traefikDir = join(baseDir.Source, "traefik");
    }
  } else {
    fastify.log.info("depker-server is running without docker.");
  }
  fastify.log.info(`depker-traefik use dir: ${traefikDir}`);

  // set env
  const env = Object.entries(config.traefik.env || {}).map(([key, value]) => {
    return `${key}=${secret(value)}`;
  });

  // set labels
  const labels = Object.entries(config.traefik.labels || {}).reduce(
    (all, [key, value]) => ({
      ...all,
      [key]: secret(value),
    }),
    {} as Record<string, string>
  );

  // set ports
  const ports = config.traefik.ports?.reduce((all, port) => {
    const [$0, $1, $2] = port.split(":");
    const [$port, $protocol = "tcp"] = ($2 ?? $1).split("/");
    if ($2) {
      return {
        ...all,
        [`${$port}/${$protocol}`]: [{ HostPort: $1, HostIp: $0 }],
      };
    } else if ($1) {
      return {
        ...all,
        [`${$port}/${$protocol}`]: [{ HostPort: $0 }],
      };
    }
    return all;
  }, {});

  // create traefik container
  // prettier-ignore
  const container = await docker.createContainer({
    name: config.traefik.name,
    Image: config.traefik.image,
    Cmd: ["--configFile=/var/traefik/traefik.yml"],
    Env: [
      "DEPKER_NAME=depker-traefik",
      "DEPKER_ID=depker-traefik",
      ...env
    ],
    Labels: {
      "depker.name": "depker-traefik",
      "depker.id": "depker-traefik",
      ...labels,
    },
    ExposedPorts: {
      "80/tcp": {},
      "443/tcp": {},
      "8080/tcp": {},
      ...Object.entries(ports || {}).reduce((all, [key]) => ({
        ...all,
        [key]: {}
      }), {})
    },
    HostConfig: {
      RestartPolicy: {
        Name: "on-failure",
        MaximumRetryCount: 2,
      },
      Binds: [
        "/var/run/docker.sock:/var/run/docker.sock",
        `${traefikDir}:/var/traefik`,
      ],
      PortBindings: {
        "80/tcp": [{ HostPort: "80" }],
        "443/tcp": [{ HostPort: "443" }],
        "8080/tcp": [{ HostPort: "8080" }],
        ...ports,
      },
    },
  });

  // connect to depker network
  const network = await depkerNetwork();
  await network.connect({ Container: container.id });

  // start container
  await container.start();

  fastify.log.info("depker-traefik started!");
};
