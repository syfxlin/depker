import { DepkerTemplate } from "../template";
import { ImageConfig } from "./types";

export const name: DepkerTemplate<ImageConfig>["name"] = "image";

export const check: DepkerTemplate<ImageConfig>["check"] = async (ctx) => {
  return !!ctx.config.image;
};

export const execute: DepkerTemplate<ImageConfig>["execute"] = async (ctx) => {
  if (!ctx.config.image) {
    throw new Error("Build failed! Couldn't find image config!");
  }
  await ctx.pull(ctx.config.image);
  await ctx.startAt({
    tag: ctx.config.image,
    ...ctx.config,
  });
};
