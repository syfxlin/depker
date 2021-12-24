import DepkerTemplate from "../template";
import { ImageConfig } from "./types";

export default class ImageTemplate extends DepkerTemplate<ImageConfig> {
  public get name(): string {
    return "image";
  }

  public async check() {
    return !!this.ctx.config.image;
  }

  public async execute() {
    if (!this.ctx.config.image) {
      throw new Error("Build failed! Couldn't find image config!");
    }
    await this.ctx.pull(this.ctx.config.image);
    await this.ctx.startAt({
      tag: this.ctx.config.image,
      ...this.ctx.config,
    });
  }
}
