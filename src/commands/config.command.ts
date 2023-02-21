import { buildpacks, config, docker, logger, traefiks } from "../bin";
import YAML from "yaml";
import { Command } from "commander";
import { NAMES } from "../constants/depker.constant";

export const $config = (cli: Command) => {
  // TODO: format 支持，filter 支持
  cli
    .command("ports:list")
    .alias("ports")
    .description("List ports")
    .option("-r, --raw", "Row output")
    .action(async (options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Listing ports started.`);
      }
      try {
        const ports = await traefiks.ports();
        const output = YAML.stringify(ports).trim();
        if (!options.raw) {
          logger.info(`Ports:\n${output}`);
          logger.done(`Listing ports successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Listing ports failed.`, e);
      }
    });
  cli
    .command("ports:add [...ports]")
    .description("Insert ports")
    .action(async (ports: string[]) => {
      logger.step(`Inserting ports started.`);
      try {
        await traefiks.ports(
          "insert",
          ports.map((p) => parseInt(p))
        );
        logger.done(`Inserting ports successfully.`);
      } catch (e: any) {
        logger.error(`Inserting ports failed.`, e);
      }
    });
  cli
    .command("ports:del [...ports]")
    .description("Remove ports")
    .action(async (ports: string[]) => {
      logger.step(`Removing ports started.`);
      try {
        await traefiks.ports(
          "remove",
          ports.map((p) => parseInt(p))
        );
        logger.done(`Removing ports successfully.`);
      } catch (e: any) {
        logger.error(`Removing ports failed.`, e);
      }
    });

  cli
    .command("secrets:list")
    .alias("secrets")
    .description("List secrets")
    .option("-r, --raw", "Raw output")
    .action(async (options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Listing secrets started.`);
      }
      try {
        const data = await config.remote();
        const output = YAML.stringify(data.secrets ?? []).trim();
        if (!options.raw) {
          logger.info(`Secrets:\n${output}`);
          logger.done(`Listing secrets successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Listing secrets failed.`, e);
      }
    });
  cli
    .command("secrets:get <key>")
    .description("Get secret")
    .option("-r, --raw", "Raw output")
    .action(async (key: string, options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Getting secret started.`);
      }
      try {
        const data = await config.remote();
        const output = YAML.stringify(data.secrets?.[key]).trim();
        if (!options.raw) {
          logger.info(`Secrets:\n${output}`);
          logger.done(`Getting secret successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Getting secret failed.`, e);
      }
    });
  cli
    .command("secrets:set <key> <value>")
    .description("Set secret")
    .action(async (key: string, value: string) => {
      logger.step(`Setting secret started.`);
      try {
        const data = await config.remote();
        data.secrets = { ...data.secrets, [key]: value };
        await config.remote(data);
        logger.done(`Setting secret successfully.`);
      } catch (e) {
        logger.error(`Setting secret failed.`, e);
      }
    });

  cli
    .command("options:list")
    .alias("options")
    .description("List options")
    .option("-r, --raw", "Raw output")
    .action(async (options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Listing options started.`);
      }
      try {
        const data = await config.remote();
        const output = YAML.stringify(data.options ?? []).trim();
        if (!options.raw) {
          logger.info(`Options:\n${output}`);
          logger.done(`Listing options successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Listing options failed.`, e);
      }
    });
  cli
    .command("options:get <key>")
    .description("Get option")
    .option("-r, --raw", "Raw output")
    .action(async (key: string, options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Getting option started.`);
      }
      try {
        const data = await config.remote();
        const output = YAML.stringify(data.options?.[key]).trim();
        if (!options.raw) {
          logger.info(`Options:\n${output}`);
          logger.done(`Getting option successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Getting option failed.`, e);
      }
    });
  cli
    .command("options:set <key> <value>")
    .description("Set option")
    .action(async (key: string, value: string) => {
      logger.step(`Setting option started.`);
      try {
        const data = await config.remote();
        data.options = { ...data.options, [key]: value };
        await config.remote(data);
        logger.done(`Setting option successfully.`);
      } catch (e) {
        logger.error(`Setting option failed.`, e);
      }
    });

  cli
    .command("config:get")
    .alias("config")
    .description("Get config")
    .option("-r, --raw", "Row output")
    .action(async (options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Getting config started.`);
      }
      try {
        const output = YAML.stringify(await config.remote()).trim();
        if (!options.raw) {
          logger.info(`Config:\n${output}`);
          logger.done(`Getting config successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Getting config failed.`, e);
      }
    });
  cli
    .command("config:edit")
    .description("Edit config")
    .option("-e, --editor <editor>", "Editor used to edit the configuration file", "nano")
    .action(async (options: Record<string, any>) => {
      try {
        await docker.containers.exec(
          NAMES.CONFIG,
          [options.editor, `/config/config.yml`],
          { interactive: true, tty: true },
          { stdio: "inherit" }
        );
        logger.done(`Editing config successfully.`);
      } catch (e) {
        logger.error(`Editing config failed.`, e);
      }
    });

  cli
    .command("buildpacks:list")
    .alias("buildpacks")
    .description("List buildpacks")
    .option("-r, --raw", "Raw output")
    .action(async (options: Record<string, any>) => {
      if (!options.raw) {
        logger.step(`Listing buildpacks started.`);
      }
      try {
        const names = Object.keys(await buildpacks.load());
        const output = YAML.stringify(names).trim();
        if (!options.raw) {
          logger.info(`Buildpacks:\n${output}`);
          logger.done(`Listing buildpacks successfully.`);
        } else {
          logger.raw(output);
        }
      } catch (e) {
        logger.error(`Listing buildpacks failed.`, e);
      }
    });
  cli
    .command("buildpacks:install <package>")
    .description("Install buildpack")
    .option("-f, --force", "Force trigger install package")
    .action(async (name: string, options: Record<string, any>) => {
      logger.step(`Installing buildpack started.`);
      try {
        await buildpacks.install(name, options.force);
        logger.done(`Installing buildpack successfully.`);
      } catch (e) {
        logger.error(`Installing buildpack failed.`, e);
      }
    });
  cli
    .command("buildpacks:uninstall <package>")
    .description("Uninstall buildpack")
    .option("-f, --force", "Force trigger install package")
    .action(async (name: string, options: Record<string, any>) => {
      logger.step(`Uninstalling buildpack started.`);
      try {
        await buildpacks.uninstall(name, options.force);
        logger.done(`Uninstalling buildpack successfully.`);
      } catch (e) {
        logger.error(`Uninstalling buildpack failed.`, e);
      }
    });
};
