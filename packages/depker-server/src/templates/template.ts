import Ctx from "../docker/ctx";
import { ClientConfig } from "../config/config";

export type DepkerTemplate<C extends ClientConfig = ClientConfig> = {
  name: string;
  check: (ctx: Ctx<C>) => Promise<boolean>;
  execute: (ctx: Ctx<C>) => Promise<void>;
};
