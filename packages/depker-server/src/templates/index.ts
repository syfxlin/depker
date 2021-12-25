import fs from "fs-extra";
import { join } from "path";
import { dir } from "../config/dir";
import { DepkerTemplate } from "./template";
import * as dockerfileTemplate from "./dockerfile";
import * as nginxTemplate from "./nginx";
import * as imageTemplate from "./image";
import * as nodejsTemplate from "./nodejs";
import * as nodejsStaticTemplate from "./nodejs-static";
import * as phpTemplate from "./php";
import * as phpFpmTemplate from "./php-fpm";

export const templates = async () => {
  const json = fs.readJsonSync(join(dir.templates, "package.json"));
  const names = Object.keys(json.dependencies || {});
  const templates = await Promise.all(
    names.map((name) => {
      const path = join(dir.templates, "node_modules", name);
      return import(path);
    })
  );
  return [
    dockerfileTemplate,
    imageTemplate,
    phpFpmTemplate,
    phpTemplate,
    nodejsStaticTemplate,
    nodejsTemplate,
    nginxTemplate,
    ...templates,
  ] as DepkerTemplate[];
};
