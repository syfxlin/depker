import { fs, path } from "./src/deps.ts";

await exec(await find());

async function find(): Promise<string> {
  // flag
  const index = Deno.args.indexOf("--config");
  if (index !== -1) {
    const p = Deno.args[index];
    Deno.args.splice(index, 1);
    if (p.match(/^(https?|file):\/\//)) {
      return p;
    } else {
      return path.toFileUrl(path.resolve(p)).toString();
    }
  }

  // path
  const root = Deno.cwd();
  const paths = [
    path.join(root, "depker.config.ts"),
    path.join(root, "depker.config.js"),
    path.join(root, ".depker/depker.config.ts"),
    path.join(root, ".depker/depker.config.js"),
    path.join(root, ".depker/depker.ts"),
    path.join(root, ".depker/depker.js"),
    path.join(root, ".depker/config.ts"),
    path.join(root, ".depker/config.js"),
  ];
  for (const p of paths) {
    if (await fs.exists(p)) {
      return path.toFileUrl(p).toString();
    }
  }

  // default
  return `https://raw.githubusercontent.com/syfxlin/depker/master/mod.ts`;
}

async function exec(path: string): Promise<void> {
  const depker = await import(path).then((mod) => mod?.depker ?? mod?.default ?? mod);
  await depker.execute();
}
