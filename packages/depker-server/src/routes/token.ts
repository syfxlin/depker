import { KoaFn } from "../types";
import { database } from "../config/database";
import { randomUUID } from "crypto";
import { auth } from "../middleware/auth";

export const token: KoaFn = (router) => {
  // list tokens
  router.get("/tokens", auth, async (ctx) => {
    ctx.status = 200;
    ctx.body = {
      message: "List tokens success!",
      tokens: database.getCollection("tokens").data,
    };
  });
  // add token
  router.post("/tokens/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: "No name given!",
      };
      return;
    }
    const token = randomUUID();
    const collection = database.getCollection("tokens");
    if (collection.findOne({ name })) {
      ctx.status = 409;
      ctx.body = {
        message: "Token already exists!",
      };
      return;
    }
    collection.insert({ name, token });
    ctx.status = 200;
    ctx.body = {
      message: "Add token success!",
      name,
      token,
    };
  });
  // remove token
  router.delete("/tokens/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: "No name given!",
      };
      return;
    }
    const tokens = database.getCollection("tokens");
    const token = tokens.findOne({ name });
    if (!token) {
      ctx.status = 200;
      ctx.body = {
        message: "Token does not exist!",
      };
      return;
    }
    tokens.remove(token);
    ctx.status = 200;
    ctx.body = {
      message: "Token remove success!",
    };
  });
};
