import path from "path";
import { fileURLToPath } from "url";
import { dockerfile, nginx_config } from "./nginx.template";
import { LoadedBuildpack } from "../buildpack.type";

export const nginx: LoadedBuildpack = {
  name: "nginx",
  directory: path.dirname(fileURLToPath(import.meta.url)),
  build: async (ctx) => {
    ctx.dockerfile(await ctx.render(dockerfile, { nginx_config }));
    await ctx.deploy();
  },
};
