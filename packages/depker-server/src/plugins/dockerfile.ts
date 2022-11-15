import { DepkerPlugin } from "./plugin.types";

export const name = "dockerfile";
export const label = "Dockerfile";
export const icon = "docker";
export const group = "General";

export const buildpack: DepkerPlugin["buildpack"] = {
  handler: async (ctx) => {
    await ctx.deployment();
  },
};
