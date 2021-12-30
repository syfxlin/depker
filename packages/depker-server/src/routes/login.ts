import { KoaFn } from "../types";
import { compare } from "bcrypt";
import { config } from "../config/config";
import { sign } from "../middleware/auth";
import { database } from "../config/database";

export const login: KoaFn = (router) => {
  // normal login
  router.post("/login", async (ctx) => {
    const token = ctx.request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        message: "No signature given!",
      };
      return;
    }
    if (!(await compare(token, config.token))) {
      ctx.status = 401;
      ctx.body = {
        message: "Not authorized!",
      };
      return;
    }
    const jwt = sign({ logged: true });
    ctx.status = 200;
    ctx.body = {
      message: "Login success!",
      token: jwt,
    };
  });

  // token login
  router.post("/login/token", async (ctx) => {
    const token = ctx.request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        message: "No signature given!",
      };
      return;
    }
    const one = database.getCollection("tokens").findOne({ token });
    if (!one) {
      ctx.status = 401;
      ctx.body = {
        message: "Not authorized!",
      };
      return;
    }
    const jwt = sign({ logged: true });
    ctx.status = 200;
    ctx.body = {
      message: "Login success!",
      token: jwt,
    };
  });
};
