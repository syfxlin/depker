import { ServiceConfig } from "../../service.type.ts";
import { pack } from "../../pack.context.ts";

export interface ImageConfig extends ServiceConfig {
  image: string;
}

export const image = pack<ImageConfig>({
  build: async (ctx) => {
    const config = ctx.config;
    await ctx.startAt(config.image, config);
  },
});
