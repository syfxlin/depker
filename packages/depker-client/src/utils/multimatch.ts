import minimatch from "minimatch";

export default function multimatch(item: string, patterns: string[]) {
  for (let pattern of patterns) {
    if (pattern[0] === "!" && !minimatch.match([item], pattern)) {
      return true;
    }
    if (minimatch.match([item], pattern)) {
      return true;
    }
  }
  return false;
}
