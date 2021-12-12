import { FastifyFn } from "../types";
import { database } from "../config/database";

export const secret: FastifyFn = (fastify) => {
  // list secrets
  fastify.get(
    "/secrets",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const secrets = database.getCollection("secrets").data;
      reply.send({ message: "List secrets success!", data: { secrets } });
    }
  );
  // list secrets with env
  fastify.get(
    "/secrets/env",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const secrets = database.getCollection("secrets").data;
      const env = secrets
        .map(({ name, value }) => `${name}=${value}`)
        .join(" ");
      reply.send(env);
    }
  );
  // add secret
  fastify.post(
    "/secrets",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const { name, value } = request.body as { name: string; value: string };
      if (!name || !value) {
        reply.code(400).send({ message: "No name or value given!" });
        return;
      }
      const collection = database.getCollection("secrets");
      if (collection.findOne({ name })) {
        reply.code(400).send({ message: "Secret already exists!" });
        return;
      }
      collection.insert({ name, value });
      reply.send({
        message: "Add secret success!",
        data: { name, value },
      });
    }
  );
  // remove secret
  fastify.delete(
    "/secrets",
    { preValidation: fastify.authenticate },
    async (request, reply) => {
      const { name } = request.body as { name: string };
      if (!name) {
        reply.code(400).send({ message: "No name given!" });
        return;
      }
      const collection = database.getCollection("secrets");
      const secret = collection.findOne({ name });
      if (!secret) {
        reply.send({ message: "Secret does not exist!" });
        return;
      }
      collection.remove(secret);
      reply.send({ message: "Secret remove success!" });
    }
  );
};
