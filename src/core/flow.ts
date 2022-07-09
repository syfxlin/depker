import { dir } from "./dir.ts";

export const init = () => {
  // ensure temp dir
  Deno.mkdirSync(dir.tmp, { recursive: true });
};

export const destroy = () => {
  // clear temp dir
  try {
    Deno.removeSync(dir.tmp, { recursive: true });
  } catch (e) {
    // ignore
  }
};
