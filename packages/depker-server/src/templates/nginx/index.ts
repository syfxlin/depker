import DepkerTemplate from "../template";
import fs from "fs-extra";
import { join } from "path";
import { NginxConfig } from "./types";
import { $choose, $if, $inject, $version } from "../../utils/template";
import { nginxConf } from "./nginx.conf";

export default class NginxTemplate extends DepkerTemplate<NginxConfig> {
  public get name(): string {
    return "nginx";
  }

  public async check() {
    return fs.pathExistsSync(
      join(
        this.ctx.folder,
        this.ctx.config.nginx?.root ?? "public",
        "index.html"
      )
    );
  }

  public async execute() {
    // prepare
    const version = $version(this.ctx.config.nginx?.version);
    const root = $choose(this.ctx.config.nginx?.root, "public");
    const nginxd = this.ctx.existsFile(".depker/nginx.d");
    // if exists: use custom, no-exists: use default
    this.ctx.writeFile(".depker/nginx.conf", nginxConf(this.ctx.config), false);

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
      ${$inject(this.ctx.config.nginx?.inject)}
    `;
    this.ctx.dockerfile(dockerfile);

    // build & start
    await this.ctx.build();
    await this.ctx.start();
  }
}
