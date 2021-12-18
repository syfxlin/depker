import { Socket } from "socket.io";

export const logger = (socket: Socket) => {
  const info = (message?: string, data?: any) => {
    socket.emit("log", {
      level: "info",
      message,
      ...data,
    });
  };

  const warn = (message?: string, data?: any) => {
    socket.emit("log", {
      level: "warn",
      message,
      ...data,
    });
  };

  const error = (message?: string, data?: any) => {
    socket.emit("log", {
      level: "error",
      message,
      ...data,
    });
  };

  const verbose = (message?: string, data?: any) => {
    socket.emit("log", {
      level: "verbose",
      message,
      ...data,
    });
  };

  return {
    info,
    warn,
    error,
    verbose,
  };
};
