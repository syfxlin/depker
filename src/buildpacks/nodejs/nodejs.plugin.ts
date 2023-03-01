import { LoadedBuildpack } from "../buildpack.type";
import path from "path";
import { fileURLToPath } from "url";
import { dockerfile_server, dockerfile_static } from "./nodejs.template";

export const nodejs: LoadedBuildpack = {
  name: "nodejs",
  directory: path.dirname(fileURLToPath(import.meta.url)),
  build: async (ctx) => {
    if (ctx.config?.nodejs?.type !== "static") {
      ctx.dockerfile(await ctx.render(dockerfile_server));
    } else {
      ctx.dockerfile(await ctx.render(dockerfile_static));
    }
    await ctx.deploy();
  },
};
