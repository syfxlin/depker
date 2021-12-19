import fs from "fs-extra";
import { basename, join, relative } from "path";
import ClientError from "../error/ClientError";
import { readYml, writeYml } from "../utils/yml";
import { pack } from "tar-fs";
import multimatch from "../utils/multimatch";
import { io, Socket } from "socket.io-client";
// @ts-ignore
import ss from "@sap_oss/node-socketio-stream";

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

export type DeployGitProps = {
  endpoint: string;
  token: string;
  repo: string;
};

export const deploy = ({ endpoint, token, folder }: DeployProps): Socket => {
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

  const tar = pack(folder, {
    ignore: (name) => {
      const relativePath = relative(folder, name);
      return multimatch(relativePath, ignores);
    },
  });

  return deployTar({ endpoint, token, tar });
};

export const deployTar = ({ endpoint, token, tar }: DeployTarProps): Socket => {
  const socket = io(`${endpoint}/deploy`, { auth: { token } });
  const stream = ss.createStream();
  socket.on("connect", () => {
    ss(socket).emit("deploy", stream);
    tar.pipe(stream);
  });
  return socket;
};
