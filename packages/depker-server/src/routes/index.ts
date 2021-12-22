import { SocketIOFn } from "../types";
import { login } from "./auth";
import { secret } from "./secret";
import { deploy } from "./deploy";
import { token } from "./token";
import { app } from "./app";
import { storage } from "./storage";
import { template } from "./template";
import { dev } from "./dev";
import { version } from "./version";
import { restore } from "./restore";

export const routes: SocketIOFn = (io) => {
  login(io);
  token(io);
  secret(io);
  deploy(io);
  app(io);
  storage(io);
  template(io);
  dev(io);
  version(io);
  restore(io);
};
