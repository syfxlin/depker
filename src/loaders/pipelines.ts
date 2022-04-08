import {
  camelCase,
  constantCase,
  pascalCase,
  snakeCase,
} from "https://deno.land/x/case@2.1.1/mod.ts";
import {
  isAbsolute,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.133.0/path/mod.ts";

export const pipelines = async (location: string, name: string) => {
  if (!isAbsolute(location)) {
    location = resolve(location);
  }
  const url = toFileUrl(location);
  const mod = await import(url.toString());
  return (
    mod[camelCase(name)] ??
    mod[snakeCase(name)] ??
    mod[pascalCase(name)] ??
    mod[constantCase(name)]
  );
};
