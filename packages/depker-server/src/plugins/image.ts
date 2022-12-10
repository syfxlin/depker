import { DepkerPlugin } from "./plugin.types";

// image is a buildpack plugin, there will be additional processing
export const image: DepkerPlugin = {
  name: "image",
  label: "Image",
  group: "General",
  icon: "docsdotrs",
  buildpack: {
    handler: async (ctx) => {
      const image = await ctx.extensions("image");
      await ctx.deployment(image);
    },
  },
};
