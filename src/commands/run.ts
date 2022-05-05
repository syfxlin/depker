import { pipelines } from "../loaders/pipelines.ts";
import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";
import { CacFn } from "./index.ts";
import { logger } from "../index.ts";

export const runCmd: CacFn = (cli) => {
  cli
    .command("run <task> [...command]", "Create and start pipeline")
    .alias("r")
    .alias("do")
    .alias("d")
    .allowUnknownOptions()
    .option("-f, --config <file>", "Name of the depker.ts", {
      default: "depker.ts",
    })
    .option("-p, --project <project>", "Location of the project", {
      default: ".",
    })
    .option("-e, --env <env>", "Env to override during execution", {
      default: [],
      type: [String],
    })
    .option("--env-file <file>", "Read env file to override during execution", {
      default: ".env",
    })
    .example((bin) => `  $ ${bin} run task1 task2`)
    .example((bin) => `  $ ${bin} run task1 task2 --some-option1 task1`)
    .example((bin) => `  $ ${bin} run task1 -f ./config/depker.ts`)
    .action(
      async (task: string, command: string[], options: Record<string, any>) => {
        // env
        const env = Object.assign(
          {},
          await config({ path: options.envFile }),
          Object.fromEntries(options.env.map((e: string) => e.split("=")))
        );
        for (const key in env) {
          if (Deno.env.get(key) !== undefined) {
            continue;
          }
          Deno.env.set(key, env[key]);
        }

        // chdir
        Deno.chdir(options.project);

        // run task
        logger.step(`Running task: ${task}`);
        const fn = await pipelines(options.config, task);
        if (!fn) {
          throw new Error("Task not found!");
        }
        await fn(...command, options);
        logger.success(`Successfully run task: ${task}`);
      }
    );
};
