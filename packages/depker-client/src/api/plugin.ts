import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type PluginProps = {
  endpoint: string;
  token: string;
  command: string;
  args?: string[];
};

export const execPlugin = <R = any>({
  endpoint,
  token,
  command,
  args,
}: PluginProps) => {
  return new Promise<R>((resolve, reject) => {
    const socket = io(`${endpoint}/plugin`, { auth: { token } });
    socket.on("connect", () => {
      socket.emit(command, ...(args ?? []));
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
