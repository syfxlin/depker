import { AppConfig } from "../../index.ts";
import { pack } from "../../ctx.ts";
import { dockerfile } from "./template.ts";

export interface SelflareConfig extends AppConfig {
  nodejs?: {
    version?: string;
    install?: string | string[];
    build?: string | string[];
    inject?: {
      before_install?: string;
      after_install?: string;
      before_build?: string;
      after_build?: string;
    };
  };
}

export const selflare = pack<SelflareConfig>({
  build: async (ctx) => {
    ctx.dockerfile(await ctx.render(dockerfile));
    await ctx.deploy();
  },
});
