export const $if = (canonical: any, v1: string, v2 = "") => {
  if (canonical) {
    return v1;
  } else {
    return v2;
  }
};

export const $for = <T>(
  items: Record<string, T> | T[] | null | undefined,
  fn: (value: [string, T], index: number, array: [string, T][]) => string
) => {
  return items ? Object.entries(items).map(fn).join("") : "";
};

export const $join = (value: number | string | string[] | number[], separator?: string) => {
  if (!value) {
    return "";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return value.join(separator ?? " ");
};
