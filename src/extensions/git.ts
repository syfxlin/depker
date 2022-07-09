import { exec, logger } from "./libs.ts";

export const sha = async (ref: string, short: number | boolean = false) => {
  const cmd = ["git", "rev-parse"];
  if (typeof short === "boolean") {
    cmd.push(`--short=${short ? 7 : 40}`);
  } else {
    cmd.push(`--short=${short ?? 40}`);
  }
  cmd.push(ref);
  const stdout = await exec({ cmd }).stdout;
  return stdout.map((i) => i.trim()).join("");
};

export const clone = async (repo: string, ref = "master", depth = 1) => {
  const cmd = [
    "git",
    "clone",
    `--branch=${ref}`,
    `--depth=${depth}`,
    repo,
    ".",
  ];

  logger.step(`Clone git repo into: ${repo} - ${ref}`);
  await exec({ cmd, type: "inherit" });
  logger.success(`Successfully clone git repo`);
};
