// prettier-ignore
export const diff = <T>(value: [Array<T>, Array<T>], keys: (value: T) => any) => {
  const v1 = new Map(value[0].map((i) => [keys(i), i]));
  const v2 = new Map(value[1].map((i) => [keys(i), i]));

  const upsert = Array.from(v1.values());
  const remove = Array.from(v2.entries()).filter(([k]) => !v1.has(k)).map(([, v]) => v);
  return { upsert, remove };
};
