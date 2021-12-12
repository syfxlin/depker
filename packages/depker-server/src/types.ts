import { fastify } from "./index";

export type FastifyFn = (instance: typeof fastify) => void;