import ServerError from "../error/ServerError";
import got from "got";

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
  // return new Promise<void>((resolve, reject) => {
  //   const socket = io(`${endpoint}/dev`, { auth: { token } });
  //
  //   // exit
  //   socket.on("exit", () => {
  //     stdout.end();
  //     resolve();
  //   });
  //   // error
  //   socket.on("error", (res) => {
  //     reject(
  //       new ServerError(
  //         res.message,
  //         res.error ? new Error(res.error) : undefined
  //       )
  //     );
  //   });
  //   // connect_error
  //   socket.on("connect_error", (err) => {
  //     reject(new ServerError("Connect error!", err));
  //   });
  //
  //   const $stdin = ss.createStream();
  //   const $stdout = ss.createStream();
  //   $stdout.pipe(stdout);
  //   stdin.pipe($stdin);
  //   ss(socket).emit("exec", name, command, $stdin, $stdout);
  // });
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
