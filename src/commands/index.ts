import CAC from "https://unpkg.com/cac@6.7.12/deno/CAC.ts";
import { runCmd } from "./run.ts";
import { versionCmd } from "./version.ts";

export type CacFn = (cli: CAC) => void;
export * from "./banner.ts";

export const commands: CacFn = (cli) => {
  runCmd(cli);
  versionCmd(cli);
};
