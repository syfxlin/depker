import { KoaFn } from "../types";
import { database } from "../config/database";
import { auth } from "../middleware/auth";

export const secret: KoaFn = (router) => {
  // list secrets
  router.get("/secrets", auth, async (ctx) => {
    const secrets = database.getCollection("secrets").data;
    ctx.status = 200;
    ctx.body = {
      message: "List secrets success!",
      secrets,
    };
  });
  // add
  router.post("/secrets", auth, async (ctx) => {
    const name = ctx.request.body.name;
    const value = ctx.request.body.value;
    if (!name || !value) {
      ctx.status = 400;
      ctx.body = {
        message: "No name or value given!",
      };
      return;
    }
    const collection = database.getCollection("secrets");
    if (collection.findOne({ name })) {
      ctx.status = 400;
      ctx.body = {
        message: "Secret already exists!",
      };
      return;
    }
    collection.insert({ name, value });
    ctx.status = 200;
    ctx.body = {
      message: "Add secret success!",
      name,
      value,
    };
  });
  // remove
  router.delete("/secrets/:name", auth, async (ctx) => {
    const name = ctx.params.name;
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: "No name given!",
      };
      return;
    }
    const collection = database.getCollection("secrets");
    const secret = collection.findOne({ name });
    if (!secret) {
      ctx.status = 200;
      ctx.body = {
        message: "Secret does not exist!",
      };
      return;
    }
    collection.remove(secret);
    ctx.status = 200;
    ctx.body = {
      message: "Secret remove success!",
    };
  });
};
