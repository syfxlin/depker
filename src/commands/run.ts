import { CacFn } from "./index.ts";
import { pipeline } from "../core/pipelines.ts";

export const runCmd: CacFn = (cli) => {
  cli
    .command("<task> [...args]", "Create and start pipeline")
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
    .example((bin) => `  $ ${bin} task1 args`)
    .example((bin) => `  $ ${bin} task1:command args --some-option1 task1`)
    .example((bin) => `  $ ${bin} task1 -f ./config/depker.ts`)
    .action(pipeline);
};
