import cac from "https://unpkg.com/cac@6.7.12/deno/index.ts";
import info from "../info.ts";
import { Logger } from "./utils/logger.ts";
import { banner } from "./commands/banner.ts";
import { run } from "./loaders/depker.ts";
import { commands } from "./commands/index.ts";

export * from "./types/index.ts";
export const cli = cac(info.name).version(info.version);
export const logger = new Logger();

commands(cli);

cli.help(banner());
cli.on("command:!", () => cli.outputHelp());
cli.on("command:*", () => cli.outputHelp());

try {
  await run(cli);
} catch (e) {
  logger.error(e);
}
