import { docker } from "../bin";
import { Command } from "commander";

export const $docker = (cli: Command) => {
  // docker
  cli
    .command("docker [commands...]")
    .description("The base command for the Docker CLI.")
    .passThroughOptions()
    .action(async (commands: string[]) => {
      await docker.execute(commands, { stdio: "inherit" });
    });
};
