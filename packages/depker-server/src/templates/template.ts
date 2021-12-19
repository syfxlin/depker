import Ctx from "../docker/ctx";
import { ClientConfig } from "../config/config";

export default abstract class DepkerTemplate<
  C extends ClientConfig = ClientConfig
> {
  protected ctx: Ctx<C>;

  constructor(ctx: Ctx<C>) {
    this.ctx = ctx;
  }

  public abstract get name(): string;

  public abstract check(): Promise<boolean>;

  public abstract execute(): Promise<void>;
}
