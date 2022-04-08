export const get = (id: string): Record<string, any> => {
  const p = depker.path.join(depker.dir.config, `${id}.json`);
  try {
    const json = Deno.readTextFileSync(p);
    return JSON.parse(json);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return {};
    }
    throw e;
  }
};

export const save = (id: string, value: Record<string, any>) => {
  const config = get(id);

  const p = depker.path.join(depker.dir.config, `${id}.json`);
  Deno.writeTextFileSync(p, JSON.stringify(depker.merge(config, value)));
};

export const remove = (id: string) => {
  const p = depker.path.join(depker.dir.config, `${id}.json`);
  Deno.removeSync(p);
};
