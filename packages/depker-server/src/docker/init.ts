import { initTraefik } from "./traefik";
import { logger } from "../logger/server";
import { docker } from "./api";

export const initDocker = async () => {
  logger.info("Initializing docker services...");

  // init network
  await docker.depkerNetwork();
  // init traefik
  await initTraefik();
};
