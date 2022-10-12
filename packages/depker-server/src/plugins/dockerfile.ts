import { DepkerPlugin } from "./plugin.types";

export const name = "dockerfile";
export const label = "Dockerfile";
export const icon = "/api/icons/docker";
export const group = "General";

export const options: DepkerPlugin["options"] = {
  buildpack: [
    {
      type: "string",
      name: "test",
      label: "Test",
      required: false,
    },
  ],
};

export const buildpack: DepkerPlugin["buildpack"] = async (ctx) => {
  await ctx.values("dockerfile", "value1");
  await ctx.values("dockerfile");
  await ctx.values("dockerfile", null);
};
