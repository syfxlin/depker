import { Depker } from "../../depker.ts";
import { Command } from "../../deps.ts";

export class CliModule extends Command {
  constructor(private readonly depker: Depker) {
    super();
    this.name(depker.name);
    this.description(depker.description);
    this.version(depker.version);
    this.helpOption("-h, --help");
    this.versionOption("-v, --version");
  }
}
