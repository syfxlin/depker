import humanFormat from "human-format";

export const humanShortTime = (value: number) => {
  const scale = new humanFormat.Scale({
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  });
  return humanFormat(value, { scale });
};

export const humanLongTime = (value: number) => {
  const scale = new humanFormat.Scale({
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
  });
  return humanFormat(value, { scale });
};
