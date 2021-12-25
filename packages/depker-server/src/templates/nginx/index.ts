import { DepkerTemplate } from "../template";
import fs from "fs-extra";
import { join } from "path";
import { NginxConfig } from "./types";
import { $choose, $if, $inject, $version } from "../../utils/template";
import { nginxConf } from "./nginx.conf";

export const name: DepkerTemplate<NginxConfig>["name"] = "nginx";

export const check: DepkerTemplate<NginxConfig>["check"] = async (ctx) => {
  return fs.pathExistsSync(
    join(ctx.folder, ctx.config.nginx?.root ?? "public", "index.html")
  );
};

export const execute: DepkerTemplate<NginxConfig>["execute"] = async (ctx) => {
  // prepare
  const version = $version(ctx.config.nginx?.version);
  const root = $choose(ctx.config.nginx?.root, "public");
  const nginxd = ctx.existsFile(".depker/nginx.d");
  // if exists: use custom, no-exists: use default
  ctx.writeFile(".depker/nginx.conf", nginxConf(ctx.config), false);

  // dockerfile
  // prettier-ignore
  const dockerfile = `
    # from nginx
    FROM nginx:${version.right}alpine
    
    # config
    COPY .depker/nginx.conf /etc/nginx/nginx.conf
    ${$if(nginxd, `
      COPY .depker/nginx.d/ /etc/nginx/conf.d/
    `)}
    
    # copy project
    WORKDIR /app
    COPY --chown=nginx:nginx ./${root} ./${root}
    
    # inject
    ${$inject(ctx.config.nginx?.inject)}
  `;
  ctx.dockerfile(dockerfile);

  // build & start
  await ctx.build();
  await ctx.start();
};
