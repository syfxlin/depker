import { DepkerPlugin } from "./plugin.types";

// image is a buildpack plugin, there will be additional processing
export const image: DepkerPlugin = {
  name: "image",
  label: "Image",
  group: "General",
  icon: "docsdotrs",
  buildpack: {
    options: [
      {
        type: "string",
        name: "image",
        label: "Image",
        placeholder: "Container Image",
        description: "An image name is made up of slash-separated name components.",
        required: true,
      },
    ],
    handle: async (ctx) => {
      const image = await ctx.values("image");
      ctx.dockerfile(`FROM ${image}`);
    },
  },
};
