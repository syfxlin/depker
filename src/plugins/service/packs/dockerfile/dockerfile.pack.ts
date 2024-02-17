import { ServiceConfig } from "../../service.type.ts";
import { pack } from "../../pack.context.ts";

export interface DockerfileConfig extends ServiceConfig {
  dockerfile?: string;
  dockerfile_path?: string;
}

export const dockerfile = pack<DockerfileConfig>({
  build: async (ctx) => {
    const config = ctx.config;
    if (config.dockerfile) {
      ctx.dockerfile(config.dockerfile);
      await ctx.deploy();
    } else if (config.dockerfile_path) {
      ctx.dockerfile(Deno.readTextFileSync(config.dockerfile_path));
      await ctx.deploy();
    } else {
      throw new Error(`Dockerfile content or Dockerfile path must be set.`);
    }
  },
});
