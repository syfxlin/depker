import * as Koa from "koa";
import { Files } from "formidable";

export type { ServerConfig, ClientConfig } from "./config/config";

// template
export type { DepkerTemplate } from "./templates/template";
export type { default as Ctx } from "./docker/ctx";

// plugin
export type { DepkerPlugin } from "./plugins/plugin";
export type { default as PluginCtx } from "./plugins/ctx";

declare module "koa" {
  interface Request extends Koa.BaseRequest {
    body?: any;
    files?: Files;
  }
}
