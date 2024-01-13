import { ServiceConfig } from "../../service.type.ts";
import { pack } from "../../pack.context.ts";
import { dockerfile } from "./coline.template.ts";

export interface ColineConfig extends ServiceConfig {
  coline?: {
    version?: string;
    memory?: string;
    install?: string | string[];
    build?: string | string[];
    start?: string | string[];
    inject?: {
      before_install?: string;
      after_install?: string;
      before_build?: string;
      after_build?: string;
      dockerfile?: string;
    };
  };
}

export const coline = pack<ColineConfig>({
  build: async (ctx) => {
    ctx.dockerfile(await ctx.render(dockerfile));
    await ctx.deploy();
  },
});
