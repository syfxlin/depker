import { CacFn } from "./index.ts";
import { logger } from "../index.ts";
import info from "../info.ts";

export const versionCmd: CacFn = (cli) => {
  cli.command("version", "Show depker version").action(() => {
    logger.info(`Depker version: ${info.version}`);
  });
};
