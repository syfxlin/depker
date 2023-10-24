import { Depker } from "../depker.ts";
import { Command } from "../deps.ts";

export class CliService extends Command<Record<string, any>> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {
    super();
    this.name(depker.name);
    this.description(depker.description);
    this.version(depker.version);
    this.helpOption("-h, --help");
    this.versionOption("-v, --version");
  }
}
