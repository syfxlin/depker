import { Command } from "commander";
import { deploys, docker, logger } from "../bin";
import path from "path";
import { $date, $short } from "../utils/human.util";
import YAML from "yaml";

export const $service = (cli: Command) => {
  cli
    .command("deploy [project]")
    .alias("services:deploy")
    .description("Deploy a service from local directory")
    .action(async (project: string) => {
      await deploys.deploy((path.isAbsolute(project) ? project : path.join(process.cwd(), project)) ?? process.cwd());
    });
  cli
    .command("list")
    .alias("services")
    .alias("services:list")
    .option("-f, --filter <filter>", "Filter output based on conditions provided")
    .option("--format <format>", "Pretty-print services using nunjucks template")
    .option("--offset <offset>", "Specifies the integer number of items that the query results should skip")
    .option("--limit <limit>", "Specifies the integer number of items that the query results should include")
    .option("--total", "Specifies whether to print the total quantity")
    .action(async (options: Record<string, any>) => {
      const fulls = await docker.containers.list();
      const infos = fulls.filter((i) => logger.filter(options.filter, i));
      if (options.format) {
        logger.render(options.format, infos);
        if (options.total) {
          logger.raw(`Total of ${fulls.length} services.`);
        }
      } else {
        logger.table(
          ["ID", "Name", "Image", "Status", "Ports", "CreatedAt"],
          infos.map((i) => [$short(i.ID), i.Name, i.Image, i.State, i.Ports, $date(i.CreatedAt)])
        );
        if (options.total) {
          logger.done(`Total of ${fulls.length} services.`);
        }
      }
    });
  cli
    .command("start <name...>")
    .alias("services:start")
    .action(async (name: string[]) => {
      logger.step(`Starting services started.`);
      try {
        await docker.containers.start(name);
        logger.done(`Starting services successfully.`);
      } catch (e) {
        logger.error(`Starting services failed.`, e);
      }
    });
  cli
    .command("restart <name...>")
    .alias("services:restart")
    .action(async (name: string[]) => {
      logger.step(`Restarting services started.`);
      try {
        await docker.containers.restart(name);
        logger.done(`Restarting services successfully.`);
      } catch (e) {
        logger.error(`Restarting services failed.`, e);
      }
    });
  cli
    .command("stop <name...>")
    .alias("services:stop")
    .action(async (name: string[]) => {
      logger.step(`Stopping services started.`);
      try {
        await docker.containers.stop(name);
        logger.done(`Stopping services successfully.`);
      } catch (e) {
        logger.error(`Stopping services failed.`, e);
      }
    });
  cli
    .command("kill <name...>")
    .alias("services:kill")
    .action(async (name: string[]) => {
      logger.step(`Killing services started.`);
      try {
        await docker.containers.kill(name);
        logger.done(`Killing services successfully.`);
      } catch (e) {
        logger.error(`Killing services failed.`, e);
      }
    });
  cli
    .command("remove <name...>")
    .alias("services:remove")
    .action(async (name: string[]) => {
      logger.step(`Removing services started.`);
      try {
        await docker.containers.remove(name);
        logger.done(`Removing services successfully.`);
      } catch (e) {
        logger.error(`Removing services failed.`, e);
      }
    });
  cli
    .command("inspect <name...>")
    .alias("services:inspect")
    .option("-f, --filter <filter>", "Filter output based on conditions provided")
    .option("--format <format>", "Pretty-print services using nunjucks template")
    .action(async (name: string[], options: Record<string, any>) => {
      const fulls = await docker.containers.inspect(name);
      const infos = fulls.filter((i) => logger.filter(options.filter, i));
      if (options.format) {
        logger.render(options.format, infos);
      } else {
        logger.raw(YAML.stringify(infos));
      }
    });
  cli
    .command("stats <name>")
    .alias("services:stats")
    .option("-f, --follow", "Enable streaming stats and follow refresh")
    .action(async (name: string, options: Record<string, any>) => {
      await docker.containers.stats(name, options.follow);
    });
  cli
    .command("top <name>")
    .alias("services:top")
    .option("-f, --follow", "Enable streaming stats and follow refresh")
    .action(async (name: string, options: Record<string, any>) => {
      await docker.containers.top(name, options.follow);
    });
  cli
    .command("logs <name>")
    .alias("services:logs")
    .option("-f, --follow", "Follow log output")
    .option("-t, --timestamps", "Show timestamps")
    .option("-n, --tail <tail>", "Number of lines to show from the end of the logs")
    .option("-s, --since <since>", "Show logs since timestamp or relative")
    .option("-u, --until <until>", "Show logs before timestamp or relative")
    .action(async (name: string, options: Record<string, any>) => {
      await docker.containers.logs(name, {
        follow: options.follow,
        timestamps: options.timestamps,
        tail: options.tail,
        since: options.since,
        until: options.until,
      });
    });
  cli
    .command("exec <name> [commands...]")
    .alias("services:exec")
    .option("-d, --detach", "Detached mode, run command in the background")
    .option("-i, --interactive", "Keep STDIN open even if not attached")
    .option("-p, --privileged", "Give extended privileges to the command")
    .option("-t, --tty", "Allocate a pseudo-TTY")
    .option("-u, --user", "Username or UID (format: <name|uid>[:<group|gid>])")
    .option("-w, --workdir", "Working directory inside the container")
    .option("-e, --env <env...>", "Set environment variables")
    .action(async (name: string, commands: string[], options: Record<string, any>) => {
      await docker.containers.exec(
        name,
        commands,
        {
          tty: options.tty,
          detach: options.detach,
          interactive: options.interactive,
          privileged: options.privileged,
          user: options.user,
          workdir: options.workdir,
          envs: options.env,
        },
        { stdio: "inherit" }
      );
    });
  cli
    .command("copy <source> <target>")
    .alias("services:copy")
    .option("-f, --follow", "Follow log output")
    .option("-t, --timestamps", "Show timestamps")
    .option("-n, --tail <tail>", "Number of lines to show from the end of the logs")
    .option("-s, --since <since>", "Show logs since timestamp or relative")
    .option("-u, --until <until>", "Show logs before timestamp or relative")
    .action(async (source: string, target: string) => {
      await docker.containers.copy(source, target);
    });
  cli
    .command("rename <name> <rename>")
    .alias("services:rename")
    .action(async (name: string, rename: string) => {
      logger.step(`Renaming services started.`);
      try {
        await docker.containers.rename(name, rename);
        logger.done(`Renaming services successfully.`);
      } catch (e) {
        logger.error(`Renaming services failed.`, e);
      }
    });
  cli
    .command("clear <name>")
    .alias("services:clear")
    .option("-f, --force", "Force clear all matching instances")
    .action(async (name: string, options: Record<string, any>) => {
      logger.step(`Cleaning services started.`);
      try {
        await docker.containers.clear(name, options.force);
        logger.done(`Cleaning services successfully.`);
      } catch (e) {
        logger.error(`Cleaning services failed.`, e);
      }
    });
  cli
    .command("prune")
    .alias("services:prune")
    .option("-f, --filter <filter...>", "Provide filter values (e.g. until=<timestamp>)")
    .action(async (options: Record<string, any>) => {
      logger.step(`Pruning services started.`);
      try {
        logger.raw(await docker.containers.prune(options.filter));
        logger.done(`Pruning services successfully.`);
      } catch (e) {
        logger.error(`Pruning services failed.`, e);
      }
    });
};
