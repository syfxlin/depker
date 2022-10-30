import { DepkerPlugin } from "./plugin.types";

export const name = "example";
export const label = "Example";
export const icon = "nodedotjs";
export const group = "General";

export const init: DepkerPlugin["init"] = async (ctx) => {
  ctx.logger.log(`init`);
  await ctx.options("test", "value1");
  await ctx.options("test");
  await ctx.options("test", null);
};

export const destroy: DepkerPlugin["destroy"] = async (ctx) => {
  ctx.logger.log(`destroy`);
};

export const buildpack: DepkerPlugin["buildpack"] = {
  options: [
    {
      type: "string",
      name: "test",
      label: "Test",
      required: false,
    },
  ],
  handle: async (ctx) => {
    await ctx.values("test", "value1");
    await ctx.values("test");
    await ctx.values("test", null);
  },
};

export const routes: DepkerPlugin["routes"] = async (ctx) => {
  //
};
