export const $choose = (
  value: string | null | undefined,
  defaultValue?: string
) => {
  return value !== null && value !== undefined ? value : defaultValue;
};

export const $if = (canonical: any, value: string) => {
  if (canonical) {
    return value;
  } else {
    return "";
  }
};

export const $for = <T>(
  items: Record<string, T> | T[] | null | undefined,
  fn: (value: [string, T], index: number, array: [string, T][]) => string
) => {
  return items ? Object.entries(items).map(fn).join("") : "";
};

export const $inject = (command?: string | string[]) => {
  if (!command) {
    return "";
  }
  if (typeof command === "string") {
    return command;
  }
  return command.join("\n");
};
