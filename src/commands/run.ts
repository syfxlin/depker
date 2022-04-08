import { pipelines } from "../loaders/pipelines.ts";
import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";
import { CacFn } from "./index.ts";
import { logger } from "../index.ts";
import { join } from "https://deno.land/std@0.133.0/path/mod.ts";

export const runCmd: CacFn = (cli) => {
  cli
    .command("run [...tasks]", "Create and start pipeline")
    .alias("r")
    .alias("do")
    .alias("d")
    .allowUnknownOptions()
    .option("-f, --config <file>", "Name of the depker.ts", {
      default: join(Deno.cwd(), "depker.ts"),
    })
    .option("-p, --project <project>", "Location of the project", {
      default: Deno.cwd(),
    })
    .option("-e, --env <env>", "Env to override during execution", {
      default: [],
      type: [String],
    })
    .option("--env-file <file>", "Read env file to override during execution", {
      default: join(Deno.cwd(), ".env"),
    })
    .example((bin) => `  $ ${bin} run task1 task2`)
    .example((bin) => `  $ ${bin} run task1 task2 --some-option1 task1`)
    .example((bin) => `  $ ${bin} run task1 -f ./config/depker.ts`)
    .action(async (tasks: string[], options: Record<string, any>) => {
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
      for (const task of tasks) {
        logger.step(`Running task: ${task}`);
        const fn = await pipelines(options.config, task);
        if (!fn) {
          throw new Error("Task not found!");
        }
        fn();
        logger.success(`Successfully run task: ${task}`);
      }
    });
};
