import { depkerNetwork } from "./network";
import { initTraefik } from "./traefik";
import { $logger } from "../logger/server";

export const initDocker = async () => {
  $logger.info("Initializing docker services...");

  // init network
  await depkerNetwork();
  // init traefik
  await initTraefik();
};
