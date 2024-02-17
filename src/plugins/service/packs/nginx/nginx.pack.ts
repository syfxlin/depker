import { ServiceConfig } from "../../service.type.ts";
import { pack } from "../../pack.context.ts";
import { dockerfile } from "./nginx.template.ts";

export interface NginxConfig extends ServiceConfig {
  nginx?: {
    version?: string;
    charset?: string;
    root_path?: string;
    index_pages?: string[];
    error_pages?: Record<number, string>;
    try_files?: boolean;
    enable_dotfile?: boolean;
    enable_cache?: boolean;
    inject?: {
      dockerfile?: string;
      root?: string;
      server?: string;
      http?: string;
    };
  };
}

export const nginx = pack<NginxConfig>({
  build: async (ctx) => {
    ctx.dockerfile(await ctx.render(dockerfile));
    await ctx.deploy();
  },
});
