import { NginxConfig } from "../nginx/nginx.pack.ts";
import { pack } from "../../pack.context.ts";
import { ServiceConfig } from "../../service.type.ts";
import { dockerfile_server, dockerfile_static } from "./nodejs.template.ts";

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

export interface NodejsServerConfig extends ServiceConfig {
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
