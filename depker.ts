import { fs, path } from "./src/deps.ts";

const lookup = async () => {
  const root = Deno.cwd();
  const paths = [
    path.join(root, "depker.config.ts"),
    path.join(root, ".depker/depker.config.ts"),
    path.join(root, "depker.config.js"),
    path.join(root, ".depker/depker.config.js"),
    path.join(root, "depker.config.cjs"),
    path.join(root, ".depker/depker.config.cjs"),
    path.join(root, "depker.config.mjs"),
    path.join(root, ".depker/depker.config.mjs"),
  ];
  for (const p of paths) {
    if (await fs.exists(p)) {
      return path.toFileUrl(p).toString();
    }
  }
  return `https://raw.githubusercontent.com/syfxlin/depker/master/mod.ts`;
};

const execute = async (url: string) => {
  const depker = await import(url).then((mod) => mod?.default ?? mod);
  await depker.execute();
};

await execute(await lookup());
