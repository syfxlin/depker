export const sha = async (ref: string, short = false) => {
  const cmd = ["git", "rev-parse"];
  if (typeof short === "boolean") {
    cmd.push(`--short=${short ? 7 : 40}`);
  } else {
    cmd.push(`--short=${short ?? 40}`);
  }
  cmd.push(ref);
  const p = await depker.exec({
    cmd,
    output: "piped",
  });
  return depker.text.decode(p.stdout).trim();
};

export const clone = async (repo: string, ref = "master", depth = 1) => {
  depker.log.step(`Clone git repo into: ${repo} - ${ref}`);
  await depker.exec({
    cmd: ["git", "clone", `--branch=${ref}`, `--depth=${depth}`, repo, "."],
    output: "inherit",
  });
  depker.log.success(`Successfully clone git repo`);
};
