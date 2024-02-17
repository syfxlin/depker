import { command } from "../deps.ts";
import { DepkerInner } from "../depker.ts";

export class CliService extends command.Command {
  constructor(private readonly depker: DepkerInner) {
    super();
    this.name(depker.name);
    this.description(depker.description);
    this.version(depker.version);
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
