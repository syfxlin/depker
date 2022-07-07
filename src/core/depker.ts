import * as builtin from "../extensions/index.ts";
import { CacFn } from "../commands/index.ts";

export const run: CacFn = async (cli) => {
  // parse
  cli.parse(["deno", "cli", ...Deno.args], { run: false });

  // base
  const cmd = cli.matchedCommand;
  if (!cmd || !cmd.commandAction) return;

  // check
  cmd.checkUnknownOptions();
  cmd.checkOptionValue();
  cmd.checkRequiredArgs();

  // args & options
  const args: any[] = [];
  const options = cli.options;
  cmd.args.forEach((arg, index) => {
    if (arg.variadic) {
      args.push(cli.args.slice(index));
    } else {
      args.push(cli.args[index]);
    }
  });

  // global
  // @ts-ignore
  globalThis.depker = {
    command: cmd.name,
    args,
    options,
    ctx: new Map(),
    ...builtin,
  };

  // run
  await cmd.commandAction.apply(cli, [...args, options]);
};
