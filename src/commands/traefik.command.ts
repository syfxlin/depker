import { logger, traefiks } from "../bin";
import { Command } from "commander";

export const $traefik = (cli: Command) => {
  cli
    .command("traefik:init")
    .alias("traefik:reload")
    .action(async () => {
      logger.step(`Reloading traefik instance started.`);
      try {
        await traefiks.reload();
        logger.done(`Reloading traefik instance successfully.`);
      } catch (e) {
        logger.error(`Reloading traefik instance failed.`, e);
      }
    });
  cli.command("traefik:start").action(async () => {
    logger.step(`Starting traefik instance started.`);
    try {
      await traefiks.start();
      logger.done(`Starting traefik instance successfully.`);
    } catch (e) {
      logger.error(`Starting traefik instance failed.`, e);
    }
  });
  cli.command("traefik:restart").action(async () => {
    logger.step(`Restarting traefik instance started.`);
    try {
      await traefiks.reload();
      logger.done(`Restarting traefik instance successfully.`);
    } catch (e) {
      logger.error(`Restarting traefik instance failed.`, e);
    }
  });
  cli.command("traefik:stop").action(async () => {
    logger.step(`Stopping traefik instance started.`);
    try {
      await traefiks.stop();
      logger.done(`Stopping traefik instance successfully.`);
    } catch (e) {
      logger.error(`Stopping traefik instance failed.`, e);
    }
  });
  cli
    .command("traefik:remove")
    .option("-f, --force", "Force the removal of a running container (uses SIGKILL)")
    .action(async () => {
      logger.step(`Removing traefik instance started.`);
      try {
        await traefiks.remove();
        logger.done(`Removing traefik instance successfully.`);
      } catch (e) {
        logger.error(`Removing traefik instance failed.`, e);
      }
    });
};
