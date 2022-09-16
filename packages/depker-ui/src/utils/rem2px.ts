const defaultFontSize = 16;
const cssRegex = /^([+-]?(?:\d+|\d*\.\d+))([a-z]*|%)$/;

const getValueAndUnit = (value: string | number): any => {
  if (typeof value !== "string") return [value, ""];
  const matchedValue = value.match(cssRegex);
  if (matchedValue) return [parseFloat(value), matchedValue[2]];
  return [value, undefined];
};

const convertBase = (base: string | number): number => {
  if (typeof base === "number") {
    return base;
  }

  const deconstructedValue = getValueAndUnit(base);
  if (deconstructedValue[1] === "px") {
    return parseFloat(base);
  }

  if (deconstructedValue[1] === "%") {
    return (parseFloat(base) / 100) * defaultFontSize;
  }

  throw new Error(`convertBase failed. Caused by ${base}`);
};

const getBaseFromDoc = (): number => {
  if (typeof document !== "undefined" && document.documentElement !== null) {
    const rootFontSize = getComputedStyle(document.documentElement).fontSize;
    return rootFontSize ? convertBase(rootFontSize) : defaultFontSize;
  }
  return defaultFontSize;
};

export const rem2px = (rem: string | number) => {
  const deconstructedValue = getValueAndUnit(rem);
  if (deconstructedValue[1] === "px") {
    return deconstructedValue[0];
  }
  if (deconstructedValue[1] !== "rem" && deconstructedValue[1] !== "") {
    throw new Error(`rem2px failed. Caused by ${deconstructedValue[1]}`);
  }
  return deconstructedValue[0] * getBaseFromDoc();
};
