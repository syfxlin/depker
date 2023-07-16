import pjson from "../../package.json" assert { type: "json" };
import { Depker } from "../depker.ts";
import { Command } from "../deps.ts";

export class CliService extends Command<Record<string, any>> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {
    super();
    this.name(pjson.name);
    this.version(pjson.version);
    this.description(pjson.description);
    this.helpOption("-h, --help");
    this.versionOption("-v, --version");
  }
}
