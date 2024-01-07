import { fs, path } from "./src/deps.ts";

const lookup = async () => {
  const paths = [] as string[];
  const roots = [Deno.cwd(), Deno.build.os === "windows" ? Deno.env.get("USERPROFILE") : Deno.env.get("HOME")];
  for (const r of roots) {
    if (r) {
      paths.push(path.join(r, "depker.config.ts"));
      paths.push(path.join(r, "depker.config.js"));
      paths.push(path.join(r, "depker.config.cjs"));
      paths.push(path.join(r, "depker.config.mjs"));
      paths.push(path.join(r, ".depker/depker.config.ts"));
      paths.push(path.join(r, ".depker/depker.config.js"));
      paths.push(path.join(r, ".depker/depker.config.cjs"));
      paths.push(path.join(r, ".depker/depker.config.mjs"));
      paths.push(path.join(r, ".depker/depker.ts"));
      paths.push(path.join(r, ".depker/depker.js"));
      paths.push(path.join(r, ".depker/depker.cjs"));
      paths.push(path.join(r, ".depker/depker.mjs"));
      paths.push(path.join(r, ".depker/config.ts"));
      paths.push(path.join(r, ".depker/config.js"));
      paths.push(path.join(r, ".depker/config.cjs"));
      paths.push(path.join(r, ".depker/config.mjs"));
    }
  }
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
