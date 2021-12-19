import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type ListTokensProps = {
  endpoint: string;
  token: string;
};

export type AddTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemoveTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listTokens = ({ endpoint, token }: ListTokensProps) => {
  return new Promise<{
    message: string;
    tokens: { name: string; token: string }[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/tokens`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("list");
    });
    socket.on("ok", (res) => {
      resolve({
        message: res.message,
        tokens: res.tokens.map((t: any) => ({ name: t.name, token: t.token })),
      });
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

export const addToken = ({ endpoint, token, name }: AddTokenProps) => {
  return new Promise<{ message: string; name: string; token: string }>(
    (resolve, reject) => {
      const socket = io(`${endpoint}/tokens`, {
        auth: {
          token,
        },
      });
      socket.on("connect", () => {
        socket.emit("add", name);
      });
      socket.on("ok", (res) => {
        resolve({
          message: res.message,
          name: res.name,
          token: res.token,
        });
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
    }
  );
};

export const removeToken = ({ endpoint, token, name }: RemoveTokenProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/tokens`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("remove", name);
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
