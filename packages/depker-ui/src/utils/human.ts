import humanFormat from "human-format";
import { DateTime } from "luxon";

export const humanTimes = (value: number) => {
  const scale = new humanFormat.Scale({
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
  });
  return humanFormat(value, { scale });
};

export const humanBytes = (value: number) => {
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
  return humanFormat(value, { scale: scale });
};

export const humanCounts = (value: number) => {
  return humanFormat(value);
};

export const humanDate = (value: number) => {
  return DateTime.fromMillis(value).toLocaleString(DateTime.DATETIME_SHORT);
};
