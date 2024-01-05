import { ServiceConfig } from "../../service.type.ts";
import { pack } from "../../pack.context.ts";
import { path } from "../../../../deps.ts";

export interface DockerfileConfig extends ServiceConfig {
  dockerfile?: string;
  dockerfile_path?: string;
}

export const dockerfile = pack<DockerfileConfig>({
  build: async (ctx) => {
    const config = ctx.config;
    if (config.dockerfile) {
      const target = await Deno.makeTempDir();
      await Deno.writeTextFile(path.join(target, `Dockerfile`), config.dockerfile);
      await ctx.startAt(await ctx.buildAt(target, config), config);
    } else if (config.dockerfile_path) {
      const target = await Deno.makeTempDir();
      await Deno.copyFile(path.resolve(config.dockerfile_path), path.join(target, `Dockerfile`));
      await ctx.startAt(await ctx.buildAt(target, config), config);
    } else {
      throw new Error(`Dockerfile content or Dockerfile path must be set.`);
    }
  },
});
