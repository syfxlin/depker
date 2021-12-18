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
  return new Promise<{ name: string; value: string }[]>((resolve, reject) => {
    const socket = io(`${endpoint}/secrets`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("list");
    });
    socket.on("ok", (res) => {
      resolve(res.secrets.map((t: any) => ({ name: t.name, value: t.value })));
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const addSecret = ({ endpoint, token, name, value }: AddSecretProps) => {
  return new Promise<{ name: string; value: string }>((resolve, reject) => {
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
        name: res.name,
        value: res.value,
      });
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const removeSecret = ({ endpoint, token, name }: RemoveSecretProps) => {
  return new Promise<void>((resolve, reject) => {
    const socket = io(`${endpoint}/secrets`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("remove", name);
    });
    socket.on("ok", () => {
      resolve();
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};
