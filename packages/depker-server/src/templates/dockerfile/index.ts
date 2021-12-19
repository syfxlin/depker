import DepkerTemplate from "../template";
import fs from "fs-extra";
import { join } from "path";

export default class DockerfileTemplate extends DepkerTemplate {
  public get name(): string {
    return "dockerfile";
  }

  public async check() {
    return fs.pathExistsSync(join(this.ctx.folder, "Dockerfile"));
  }

  public async execute() {
    const image = await this.ctx.build();
    await this.ctx.start(image);
  }
}
