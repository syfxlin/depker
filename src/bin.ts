import os from "os";
import path from "path";
import pjson from "../package.json" assert { type: "json" };
import { NAMES } from "./constants/depker.constant";
import { ConfigService } from "./services/config.service";
import { LoggerService } from "./services/logger.service";
import { $auth } from "./commands/auth.command";
import { $docker } from "./commands/docker.command";
import { DockerService } from "./services/docker.service";
import { TraefikService } from "./services/traefik.service";
import { $traefik } from "./commands/traefik.command";
import { $config } from "./commands/config.command";
import { DeployService } from "./services/deploy.service";
import { BuildpackService } from "./services/buildpack.service";
import { Command } from "commander";
import { $service } from "./commands/service.command";

export const cli = new Command(NAMES.DEPKER);

cli.allowUnknownOption();
cli.enablePositionalOptions();

export const logger = new LoggerService(cli);
export const config = new ConfigService(cli);
export const docker = new DockerService(cli);
export const deploys = new DeployService(cli);
export const traefiks = new TraefikService(cli);
export const buildpacks = new BuildpackService(cli);

$auth(cli);
$config(cli);
$docker(cli);
$service(cli);
$traefik(cli);

cli.version(pjson.version, "-v, --version", "Output depker version number");
cli.option("--debug", "Enable debug mode", false);
cli.option("--timestamp", "Enable timestamp output", false);
cli.option("--config <config>", "Location of client config files", path.join(os.homedir(), ".depker"));

try {
  await cli.parseAsync(process.argv);
} catch (e) {
  logger.error(`Oops!`, e);
  process.exit(1);
}
