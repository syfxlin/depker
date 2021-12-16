import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

export type LoginProps = {
  endpoint: string;
  token: string;
};

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

export const login = ({ endpoint, token }: LoginProps) => {
  return new Promise<string>((resolve, reject) => {
    const socket = io(`${endpoint}/login`);
    socket.on("connect", () => {
      socket.emit("login", token);
    });
    socket.on("ok", (res) => {
      resolve(res.token);
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const loginByToken = ({ endpoint, token }: LoginProps) => {
  return new Promise<string>((resolve, reject) => {
    const socket = io(`${endpoint}/login`);
    socket.on("connect", () => {
      socket.emit("token", token);
    });
    socket.on("ok", (res) => {
      resolve(res.token);
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const listTokens = ({ endpoint, token }: ListTokensProps) => {
  return new Promise<{ name: string; token: string }[]>((resolve, reject) => {
    const socket = io(`${endpoint}/tokens`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("list");
    });
    socket.on("ok", (res) => {
      resolve(res.tokens.map((t: any) => ({ name: t.name, token: t.token })));
    });
    socket.on("error", (res) => {
      reject(new ServerError(res.message));
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const addToken = ({ endpoint, token, name }: AddTokenProps) => {
  return new Promise<{ name: string; token: string }>((resolve, reject) => {
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
        name: res.name,
        token: res.token,
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

export const removeToken = ({ endpoint, token, name }: AddTokenProps) => {
  return new Promise<void>((resolve, reject) => {
    const socket = io(`${endpoint}/tokens`, {
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
