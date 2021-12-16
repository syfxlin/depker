import { SocketIOFn } from "../types";
import { login, token } from "./auth";
import { secret } from "./secret";
import { deploy } from "./deploy";

export const routes: SocketIOFn = (io) => {
  login(io);
  token(io);
  secret(io);
  deploy(io);
};
