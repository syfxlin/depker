import { pack } from "../../ctx.ts";
import { AppConfig } from "../../index.ts";

export interface ImageConfig extends AppConfig {
  image: string;
}

export const image = pack<ImageConfig>({
  build: async (ctx) => {
    ctx.config.$$image = ctx.config.image;
    await ctx.start();
  },
});
