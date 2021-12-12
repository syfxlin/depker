import yaml from "yaml";
import fs from "fs-extra";

export const readYml = <T>(path: string): T => {
  return yaml.parse(fs.readFileSync(path).toString());
};

export const writeYml = (path: string, data: any) => {
  fs.outputFileSync(path, yaml.stringify(data));
};
