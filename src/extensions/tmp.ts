const gitignore = () => {
  // write gitignore
  const gitignore = depker.path.posix.join(".depker", ".gitignore");
  depker.fs.ensureFileSync(gitignore);
  const ignore = Deno.readTextFileSync(gitignore);
  if (!ignore.split(/\r?\n/g).includes("tmp")) {
    Deno.writeTextFileSync(gitignore, `${ignore}\ntmp\n`);
  }
};

export const file = (prefix: string, content?: string) => {
  gitignore();

  // write tmp file
  const file = depker.path.posix.join(
    ".depker",
    "tmp",
    `${prefix}-${depker.uuid()}`
  );
  depker.fs.ensureFileSync(file);
  Deno.writeTextFileSync(file, content ?? "");
  return file;
};

export const dir = (prefix: string) => {
  gitignore();

  // make tmp dir
  const dir = depker.path.posix.join(
    ".depker",
    "tmp",
    `${prefix}-${depker.uuid()}`
  );
  depker.fs.ensureDirSync(dir);
  return dir;
};
