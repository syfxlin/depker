import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type PluginProps = {
  endpoint: string;
  token: string;
  command: string;
  args?: string[];
};

export type ListPluginsProps = {
  endpoint: string;
  token: string;
};

export type AddPluginProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemovePluginProps = {
  endpoint: string;
  token: string;
  name: string;
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

export const listPlugins = ({ endpoint, token }: ListPluginsProps) => {
  return new Promise<{
    message: string;
    plugins: string[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/plugins`, {
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
        plugins: res.plugins,
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

export const addPlugin = ({ endpoint, token, name }: AddPluginProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/plugins`, {
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

export const removePlugin = ({ endpoint, token, name }: RemovePluginProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/plugins`, {
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
