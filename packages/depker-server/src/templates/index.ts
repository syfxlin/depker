import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import DepkerTemplate from "./template";
import Ctx from "../docker/ctx";
import DockerfileTemplate from "./dockerfile";
import NginxTemplate from "./nginx";
import ImageTemplate from "./image";

export const templates = async (ctx: Ctx) => {
  const json = fs.readJsonSync(join(dir.extensions, "package.json"));
  const names = Object.keys(json.dependencies || {});
  const templates = await Promise.all(
    names.map((name) => {
      const path = join(dir.extensions, "node_modules", name);
      return import(path);
    })
  );
  // prettier-ignore
  return [DockerfileTemplate, ImageTemplate, NginxTemplate, ...templates].map((template) => new template(ctx)) as DepkerTemplate[];
};
