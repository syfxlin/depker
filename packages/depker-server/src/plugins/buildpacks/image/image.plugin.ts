import { LoadedDepkerPlugin } from "../../plugin.types";
import path from "path";
import { fileURLToPath } from "url";

// image is a buildpack plugin, there will be additional processing
export const image: LoadedDepkerPlugin = {
  pkg: "image",
  dir: path.dirname(fileURLToPath(import.meta.url)),
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
