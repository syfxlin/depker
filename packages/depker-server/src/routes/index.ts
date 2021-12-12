import { FastifyFn } from "../types";
import { login, token } from "./auth";
import { secret } from "./secret";

export const routes: FastifyFn = (fastify) => {
  login(fastify);
  token(fastify);
  secret(fastify);
};
