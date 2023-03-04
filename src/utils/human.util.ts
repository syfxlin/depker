import humanFormat from "human-format";
import { DateTime } from "luxon";

export const $bytes = (value: number) => {
  const scale = new humanFormat.Scale({
    KB: Math.pow(1024, 1),
    MB: Math.pow(1024, 2),
    GB: Math.pow(1024, 3),
    TB: Math.pow(1024, 4),
    PB: Math.pow(1024, 5),
    EB: Math.pow(1024, 6),
    ZB: Math.pow(1024, 7),
    YB: Math.pow(1024, 8),
  });
  return humanFormat(value, { scale });
};

export const $date = (value: string | number) => {
  const time = typeof value === "string" ? DateTime.fromISO(value) : DateTime.fromMillis(value);
  return time.toLocaleString({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const $short = (value: string) => {
  return value.substring(0, 10);
};
