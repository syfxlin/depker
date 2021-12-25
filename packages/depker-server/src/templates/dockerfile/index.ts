import { DepkerTemplate } from "../template";

export const name: DepkerTemplate["name"] = "dockerfile";

export const check: DepkerTemplate["check"] = async (ctx) => {
  return ctx.existsFile("Dockerfile");
};

export const execute: DepkerTemplate["execute"] = async (ctx) => {
  if (!(await check(ctx))) {
    throw new Error("Build failed! Couldn't find Dockerfile!");
  }
  await ctx.build();
  await ctx.start();
};
