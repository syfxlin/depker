import { Depker } from "../depker.ts";
import { Command } from "../deps/jsr/command.ts";

export class CliModule extends Command {
  constructor(depker: Depker) {
    super();
    this.name(depker.name);
    this.version(depker.version);
    this.description(depker.description);
    this.helpOption("-h, --help");
    this.versionOption("-v, --version");
    this.option("--debug", "Enable debug mode", {
      global: true,
      default: false,
      action: (options) => {
        if (options.debug) {
          Deno.env.set("DEPKER_OPTION_DEBUG", "true");
        }
      },
    });
    this.option("--timestamp", "Enable timestamp output", {
      global: true,
      default: false,
      action: (options) => {
        if (options.timestamp) {
          Deno.env.set("DEPKER_OPTION_TIMESTAMP", "true");
        }
      },
    });
  }
}
