import { KoaFn } from "../types";
import packageJson from "../../package.json";

export const version: KoaFn = (router) => {
  router.get("/version", async (ctx) => {
    ctx.status = 200;
    ctx.body = {
      message: "Get server version success!",
      version: packageJson.version,
    };
  });
};
