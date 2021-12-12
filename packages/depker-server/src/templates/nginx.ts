import DepkerTemplate from "./template";
import fs from "fs-extra";
import { join } from "path";

export default class NginxTemplate extends DepkerTemplate {
  public get name(): string {
    return "nginx";
  }

  public async check() {
    return fs.pathExistsSync(join(this.ctx.folder, "index.html"));
  }

  public async execute() {
    fs.writeFileSync(
      join(this.ctx.folder, "Dockerfile"),
      `FROM nginx:alpine
    COPY . /usr/share/nginx/html
    RUN chmod -R 755 /usr/share/nginx/html`
    );
    this.ctx.logger.info("Build image");
    await this.ctx.build();
    this.ctx.logger.info("Start container");
    await this.ctx.start();
  }
}
