import DepkerTemplate from "../template";

export default class DockerfileTemplate extends DepkerTemplate {
  public get name(): string {
    return "dockerfile";
  }

  public async check() {
    return this.ctx.existsFile("Dockerfile");
  }

  public async execute() {
    const image = await this.ctx.build();
    await this.ctx.start(image);
  }
}
