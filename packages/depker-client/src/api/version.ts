import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type VersionProps = {
  endpoint: string;
};

export const version = ({ endpoint }: VersionProps) => {
  return new Promise<{
    message: string;
    version: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/version`);
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
