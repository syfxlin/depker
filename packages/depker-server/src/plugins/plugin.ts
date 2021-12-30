import PluginCtx from "./ctx";
import { Context } from "koa";

export type DepkerPlugin = {
  name: string;
  register?: (ctx: PluginCtx) => Promise<void>;
  routes?: (ctx: PluginCtx, koa: Context) => Promise<void>;
};
