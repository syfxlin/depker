import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type ListSecretsProps = {
  endpoint: string;
  token: string;
};

export type AddSecretProps = {
  endpoint: string;
  token: string;
  name: string;
  value: string;
};

export type RemoveSecretProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listSecrets = ({ endpoint, token }: ListSecretsProps) => {
  return new Promise<{
    message: string;
    secrets: { name: string; value: string }[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/secrets`, {
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
        secrets: res.secrets.map((t: any) => ({
          name: t.name,
          value: t.value,
        })),
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

export const addSecret = ({ endpoint, token, name, value }: AddSecretProps) => {
  return new Promise<{ message: string; name: string; value: string }>(
    (resolve, reject) => {
      const socket = io(`${endpoint}/secrets`, {
        auth: {
          token,
        },
      });
      socket.on("connect", () => {
        socket.emit("add", name, value);
      });
      socket.on("ok", (res) => {
        resolve({
          message: res.message,
          name: res.name,
          value: res.value,
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

export const removeSecret = ({ endpoint, token, name }: RemoveSecretProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/secrets`, {
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
