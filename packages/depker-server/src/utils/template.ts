export const $choose = (
  value: string | null | undefined,
  defaultValue?: string
) => {
  return value !== null && value !== undefined ? value : defaultValue;
};

export const $if = (canonical: any, v1: string, v2: string = "") => {
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

export const $inject = (command?: string | string[]) => {
  if (!command) {
    return "";
  }
  if (typeof command === "string") {
    return command;
  }
  return command.join("\n");
};

export const $cmd = (command?: string | string[]) => {
  if (!command) {
    return "";
  }
  if (typeof command === "string") {
    return `CMD ${command}`;
  }
  return `CMD ${JSON.stringify(command)}`;
};

export const $version = (
  version?: string | null | undefined,
  defaultValue: string = ""
) => {
  if (version === null || version === undefined) {
    return {
      left: defaultValue,
      none: defaultValue,
      right: defaultValue,
    };
  } else {
    return {
      left: `-${version}`,
      none: version,
      right: `${version}-`,
    };
  }
};
