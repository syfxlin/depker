import Fastify from "fastify";
import { docker } from "./docker/api";
import { register } from "./register";
import { routes } from "./routes";
import { initDocker } from "./docker/init";

export const fastify = Fastify({
  logger: true,
});
// register
register(fastify);
// route
routes(fastify);

initDocker();

fastify.get("/", async (request, reply) => {
  const containers = await docker.listContainers({ all: true });
  reply.send({ hello: containers });
});

fastify.listen(3000, "0.0.0.0", (err, address) => {
  if (err) {
    fastify.log.error(err);
  } else {
    fastify.log.info(`Server running at: ${address}`);
  }
});
export { FastifyFn } from "./types";
