import { match } from "minimatch";

export default function multimatch(item: string, patterns: string[]) {
  for (let pattern of patterns) {
    if (pattern[0] === "!" && !match([item], pattern)) {
      return true;
    }
    if (match([item], pattern)) {
      return true;
    }
  }
  return false;
}
