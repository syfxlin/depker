import { pack } from "../../ctx.ts";
import { AppConfig } from "../../index.ts";
import { dockerfile } from "./template.ts";

export interface NginxConfig extends AppConfig {
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
