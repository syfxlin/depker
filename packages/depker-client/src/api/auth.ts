import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type LoginProps = {
  endpoint: string;
  token: string;
};

export const login = ({ endpoint, token }: LoginProps) => {
  return new Promise<{
    message: string;
    token: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/login`);
    socket.on("connect", () => {
      socket.emit("login", token);
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

export const loginByToken = ({ endpoint, token }: LoginProps) => {
  return new Promise<{
    message: string;
    token: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/login`);
    socket.on("connect", () => {
      socket.emit("token", token);
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
