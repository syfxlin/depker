import { depkerNetwork } from "./network";
import { fastify } from "../index";
import { initTraefik } from "./traefik";

export const initDocker = async () => {
  fastify.log.info("Initializing docker services...");

  // init network
  await depkerNetwork();
  // init traefik
  await initTraefik();
};
