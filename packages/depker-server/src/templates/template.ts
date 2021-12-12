import Ctx from "../docker/ctx";

export default abstract class DepkerTemplate {
  protected ctx: Ctx;

  constructor(ctx: Ctx) {
    this.ctx = ctx;
  }

  public abstract get name(): string;

  public abstract check(): Promise<boolean>;

  public abstract execute(): Promise<void>;
}
