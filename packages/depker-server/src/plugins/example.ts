import { PluginContext } from "./plugin.context";
import { DepkerPlugin } from "./plugin.types";

export const name = "example";

export const init = async (ctx: PluginContext) => {
  ctx.logger.log(`init`);
  await ctx.options("test", "value1");
  await ctx.options("test");
  await ctx.options("test", null);
};

export const destroy = async (ctx: PluginContext) => {
  ctx.logger.log(`destroy`);
};

export const buildpack: DepkerPlugin["buildpack"] = {
  icon: "/icons/nodedotjs",
  options: [
    {
      type: "string",
      name: "test",
      label: "Test",
      required: false,
    },
  ],
  handler: async (ctx) => {
    await ctx.values("test", "value1");
    await ctx.values("test");
    await ctx.values("test", null);
  },
};

export const routes = async (ctx: any) => {
  //
};
