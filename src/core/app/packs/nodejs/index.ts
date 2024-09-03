import { NginxConfig } from "../nginx/index.ts";
import { pack } from "../../ctx.ts";
import { AppConfig } from "../../index.ts";
import { dockerfile_server, dockerfile_static } from "./template.ts";

export interface NodejsStaticConfig extends NginxConfig {
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

export interface NodejsServerConfig extends AppConfig {
  nodejs?: {
    version?: string;
    install?: string | string[];
    build?: string | string[];
    start?: string | string[];
    inject?: {
      before_install?: string;
      after_install?: string;
      before_build?: string;
      after_build?: string;
    };
  };
}

export const nodejs = {
  static: pack<NodejsStaticConfig>({
    build: async (ctx) => {
      ctx.dockerfile(await ctx.render(dockerfile_static));
      await ctx.deploy();
    },
  }),
  server: pack<NodejsServerConfig>({
    build: async (ctx) => {
      ctx.dockerfile(await ctx.render(dockerfile_server));
      await ctx.deploy();
    },
  }),
};
