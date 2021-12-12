import fs from "fs-extra";
import { basename, join, relative } from "path";
import ClientError from "./error/ClientError";
import { readYml, writeYml } from "./utils/yml";
import { pack } from "tar-fs";
import { match } from "minimatch";
import got from "got";

export type DeployProps = {
  endpoint: string;
  token: string;
  folder: string;
};

export const deploy = ({ endpoint, token, folder }: DeployProps) => {
  if (!fs.pathExistsSync(folder)) {
    throw new ClientError(`Path ${folder} do not exists!`);
  }

  // if not exists config file, create
  const config = join(folder, "depker.yml");
  if (!fs.pathExistsSync(config)) {
    writeYml(config, { name: basename(folder) });
  }

  // validate config
  try {
    readYml(config);
  } catch (e) {
    throw new ClientError(`Your depker.yml is not valid`, e);
  }

  const ignorePath = join(folder, ".gitignore");
  const ignores = fs.pathExistsSync(ignorePath)
    ? fs
        .readFileSync(ignorePath)
        .toString()
        .split("\n")
        .filter((l) => l)
    : [];

  const stream = pack(folder, {
    ignore: (name) => {
      const relativePath = relative(folder, name);
      return !!ignores.find((ignore) => match([relativePath], ignore));
    },
  });

  return stream.pipe(
    got.stream.post(`${endpoint}/deploy`, {
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
      },
    })
  );
};
