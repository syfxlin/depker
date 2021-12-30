import fs from "fs-extra";
import { basename, join, relative } from "path";
import ClientError from "../error/ClientError";
import { readYml, writeYml } from "../utils/yml";
import { pack } from "tar-fs";
import ignore from "ignore";
import got from "got";
import ServerError from "../error/ServerError";

export type DeployProps = {
  endpoint: string;
  token: string;
  folder: string;
};

export type DeployTarProps = {
  endpoint: string;
  token: string;
  tar: NodeJS.ReadableStream;
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

  const ignores = join(folder, ".gitignore");
  const ig = ignore().add(
    fs.pathExistsSync(ignores)
      ? fs
          .readFileSync(ignores)
          .toString()
          .split("\n")
          .filter((l) => l)
      : []
  );
  const tar = pack(folder, {
    ignore: (name) => {
      const relativePath = relative(folder, name);
      return ig.ignores(relativePath);
    },
  });

  return deployTar({ endpoint, token, tar });
};

export const deployTar = async ({ endpoint, token, tar }: DeployTarProps) => {
  try {
    return tar.pipe(
      await got.stream.post(`${endpoint}/deploy`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
  } catch (e: any) {
    throw new ServerError(e);
  }
};
