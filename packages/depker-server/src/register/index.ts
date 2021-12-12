import { FastifyFn } from "../index";
import { auth } from "./auth";

export const register: FastifyFn = (fastify) => {
  auth(fastify);
};
