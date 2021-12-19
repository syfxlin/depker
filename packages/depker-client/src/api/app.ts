import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type ListAppsProps = {
  endpoint: string;
  token: string;
  state?: "all" | "running" | "exited" | "ready" | "paused";
};

export type RemoveAppProps = {
  endpoint: string;
  token: string;
  name: string;
  force?: boolean;
};

export type RestartAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type StartAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type StopAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type AppInfoProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listApps = ({ endpoint, token, state }: ListAppsProps) => {
  return new Promise<{
    message: string;
    apps: {
      id: string;
      name: string;
      container: string;
      created: number;
      status: string;
      state: "running" | "exited" | "ready" | "paused";
    }[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("list", state || "all");
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

export const removeApp = ({ endpoint, token, name, force }: RemoveAppProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("remove", name, force);
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

export const restartApp = ({ endpoint, token, name }: RestartAppProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("restart", name);
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

export const startApp = ({ endpoint, token, name }: StartAppProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("start", name);
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

export const stopApp = ({ endpoint, token, name }: StopAppProps) => {
  return new Promise<{
    message: string;
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("stop", name);
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

export const appInfo = ({ endpoint, token, name }: StopAppProps) => {
  return new Promise<{
    message: string;
    info: {
      id: string;
      name: string;
      container: string;
      image: string;
      command: string;
      created: number;
      ports: string[];
      labels: string[];
      state: "running" | "exited" | "ready" | "paused";
      status: string;
      networks: string[];
      networkMode: string;
      mounts: string[];
    };
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/apps`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("info", name);
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
