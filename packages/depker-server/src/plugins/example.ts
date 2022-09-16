import { PluginContext } from "./plugin.context";

export const name = "example";

export const init = async (ctx: PluginContext) => {
  ctx.logger.log(`init`);
  await ctx.config("test", "value1");
};

export const destroy = async (ctx: PluginContext) => {
  ctx.logger.log(`destroy`);
};

export const routes = async (ctx: any) => {
  //
};
