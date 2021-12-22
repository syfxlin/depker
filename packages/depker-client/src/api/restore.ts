import { io, Socket } from "socket.io-client";

export type RestoreProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RestoreAllProps = {
  endpoint: string;
  token: string;
};

export const restore = ({ endpoint, token, name }: RestoreProps): Socket => {
  const socket = io(`${endpoint}/restore`, { auth: { token } });
  socket.on("connect", () => {
    socket.emit("restore", name);
  });
  return socket;
};

export const restoreAll = ({ endpoint, token }: RestoreAllProps): Socket => {
  const socket = io(`${endpoint}/restore`, { auth: { token } });
  socket.on("connect", () => {
    socket.emit("all");
  });
  return socket;
};
