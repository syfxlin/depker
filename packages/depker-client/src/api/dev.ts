import { io } from "socket.io-client";
// @ts-ignore
import ss from "@sap_oss/node-socketio-stream";
import ServerError from "../error/ServerError";

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

export const exec = ({
  endpoint,
  token,
  name,
  command,
  stdin,
  stdout,
}: ExecProps) => {
  return new Promise<void>((resolve, reject) => {
    const socket = io(`${endpoint}/dev`, { auth: { token } });

    // exit
    socket.on("exit", () => {
      stdout.end();
      resolve();
    });
    // error
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    // connect_error
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });

    const $stdin = ss.createStream();
    const $stdout = ss.createStream();
    $stdout.pipe(stdout);
    stdin.pipe($stdin);
    ss(socket).emit("exec", name, command, $stdin, $stdout);
  });
};

export const logs = ({ endpoint, token, name, follow }: LogsProps) => {
  return new Promise<{
    message: string;
    stream: NodeJS.ReadableStream;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/dev`, { auth: { token } });
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
    ss(socket).on("ok", (res: any, stream: NodeJS.ReadableStream) => {
      resolve({
        message: res.message,
        stream,
      });
    });
    socket.emit("logs", name, follow);
  });
};

export const prune = ({ endpoint, token }: PruneProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/dev`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("prune");
    });
    socket.on("ok", (res) => {
      resolve(res);
    });
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};
