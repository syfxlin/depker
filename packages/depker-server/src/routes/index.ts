import { FastifyFn } from "../types";
import { login, token } from "./auth";
import { secret } from "./secret";
import { deploy } from "./deploy";

export const routes: FastifyFn = (fastify) => {
  fastify.addContentTypeParser("*", (request, payload, done) => done(null));

  login(fastify);
  token(fastify);
  secret(fastify);
  deploy(fastify);
};
