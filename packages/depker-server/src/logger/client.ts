import { Socket } from "socket.io";

export const logger = (socket: Socket) => {
  const info = (message?: string, data?: any) => {
    socket.emit("info", {
      message,
      ...data,
    });
  };

  const error = (message?: string, data?: any) => {
    socket.emit("error", {
      message,
      ...data,
    });
  };

  const verbose = (message?: string, data?: any) => {
    socket.emit("verbose", {
      message,
      ...data,
    });
  };

  return {
    info,
    error,
    verbose,
  };
};
