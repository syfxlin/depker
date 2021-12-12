import fastifyAuth, { FastifyAuthFunction } from "fastify-auth";
import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { FastifyFn } from "../types";
import fastifyJWT from "fastify-jwt";
import { config } from "../config/config";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: FastifyAuthFunction;
  }
}

export const auth: FastifyFn = (fastify) => {
  fastify.register(fastifyJWT, {
    secret: config.secret,
  });
  fastify.register(fastifyAuth);
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (e) {
        reply.send(e);
      }
    }
  );
};
