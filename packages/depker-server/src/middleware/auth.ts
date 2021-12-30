import jwt from "koa-jwt";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config/config";

export const auth = jwt({
  secret: config.secret,
  getToken(ctx) {
    return ctx.request.headers.authorization?.replace("Bearer ", "") ?? null;
  },
});

export const sign = (payload: object) =>
  jsonwebtoken.sign(payload, config.secret, { expiresIn: "30d" });
