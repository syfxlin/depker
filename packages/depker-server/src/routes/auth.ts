import { FastifyFn } from "../types";
import { compareSync } from "bcrypt";
import { database } from "../config/database";
import { randomUUID } from "crypto";
import { config } from "../config/config";

export const login: FastifyFn = (fastify) => {
  // login by config token
  fastify.post("/login", async (request, reply) => {
    const { token } = request.body as { token: string };
    if (!token) {
      reply.code(401).send({ message: "No signature given!" });
      return;
    }
    if (!compareSync(token, config.token)) {
      reply.code(401).send({ message: "Not authorized!" });
      return;
    }
    const jwt = fastify.jwt.sign({ logged: true });
    reply.send({ message: "Login success!", data: { token: jwt } });
  });
  // login by database token
  fastify.post("/token", async (request, reply) => {
    const { token } = request.body as { token: string };
    if (!token) {
      reply.code(401).send({ message: "No signature given!" });
      return;
    }
    const one = database.getCollection("tokens").findOne({ token });
    if (!one) {
      reply.code(401).send({ message: "Not authorized!" });
      return;
    }
    const jwt = fastify.jwt.sign({ logged: true });
    reply.send({ message: "Login success!", data: { token: jwt } });
  });
};

export const token: FastifyFn = (fastify) => {
  // get all tokens
  fastify.get(
    "/tokens",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      reply.send({
        message: "List tokens success!",
        data: { tokens: database.getCollection("tokens").data },
      });
    }
  );
  // add token
  fastify.post(
    "/tokens",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const { name } = request.body as { name: string };
      if (!name) {
        reply.code(400).send({ message: "No name given!" });
        return;
      }
      const token = randomUUID();
      const collection = database.getCollection("tokens");
      if (collection.findOne({ name })) {
        reply.code(400).send({ message: "Token already exists!" });
        return;
      }
      collection.insert({ name, token });
      reply.send({
        message: "Add token success!",
        data: { name, token },
      });
    }
  );
  // remove token
  fastify.delete(
    "/tokens",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const { name } = request.body as { name: string };
      if (!name) {
        reply.code(400).send({ message: "No name given!" });
        return;
      }
      const tokens = database.getCollection("tokens");
      const token = tokens.findOne({ name });
      if (!token) {
        reply.send({ message: "Token does not exist!" });
        return;
      }
      tokens.remove(token);
      reply.send({ message: "Token remove success!" });
    }
  );
};
