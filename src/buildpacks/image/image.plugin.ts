import { LoadedBuildpack } from "../buildpack.type";
import path from "path";
import { fileURLToPath } from "url";

export const image: LoadedBuildpack = {
  name: "image",
  directory: path.dirname(fileURLToPath(import.meta.url)),
  build: async (ctx) => {
    await ctx.deploy();
  },
};
