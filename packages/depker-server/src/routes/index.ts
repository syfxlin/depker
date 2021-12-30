import { KoaFn } from "../types";
import { login } from "./login";
import { deploy } from "./deploy";
import { app as $app } from "./app";
import { plugin } from "./plugin";
import { restore } from "./restore";
import { secret } from "./secret";
import { storage } from "./storage";
import { template } from "./template";
import { token } from "./token";
import { version } from "./version";
import { dev } from "./dev";

export const routes: KoaFn = (router, app) => {
  $app(router, app);
  deploy(router, app);
  dev(router, app);
  login(router, app);
  plugin(router, app);
  restore(router, app);
  secret(router, app);
  storage(router, app);
  template(router, app);
  token(router, app);
  version(router, app);
};
