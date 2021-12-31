import ServerError from "../error/ServerError";
import got from "got";
import { createWebSocketStream, WebSocket } from "ws";

export type ExecProps = {
  endpoint: string;
  token: string;
  name: string;
  command: string[];
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
};

export type LogsProps = {
  endpoint: string;
  token: string;
  name: string;
  follow?: boolean;
};

export type PruneProps = {
  endpoint: string;
  token: string;
};

export const exec = async ({
  endpoint,
  token,
  name,
  command,
  stdin,
  stdout,
}: ExecProps) => {
  try {
    const url = new URL(`${endpoint}/exec/${name}`);
    url.protocol = url.protocol.replace("http", "ws");
    command.forEach((cmd) => url.searchParams.append("command", cmd));
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const duplex = createWebSocketStream(ws, { encoding: "binary" });
    stdin.pipe(duplex);
    duplex.pipe(stdout);
    return new Promise<void>((resolve) => {
      duplex.on("end", resolve);
    });
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const logs = async ({ endpoint, token, name, follow }: LogsProps) => {
  try {
    return await got.stream.get(`${endpoint}/logs/${name}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: {
        follow,
      },
    });
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const prune = async ({ endpoint, token }: PruneProps) => {
  try {
    return await got
      .post(`${endpoint}/prune`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};
