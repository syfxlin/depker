import React, { ReactNode, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Static } from "ink";

export type LoggerProps = {
  socket: Socket;
  onEnd?: () => void;
  children: (item: LoggerData, index: number) => ReactNode;
};

export type LoggerData = {
  level: "info" | "warn" | "error" | "verbose";
  message: string;
  [key: string]: any;
};

export const Logger: React.FC<LoggerProps> = ({ socket, onEnd, children }) => {
  const [items, setItems] = useState<LoggerData[]>([]);
  useEffect(() => {
    socket.on("connect_error", (err) => {
      setItems((items) => [
        ...items,
        {
          level: "error",
          message: "Connect error!",
          error: err.message,
        },
      ]);
      onEnd?.();
    });
    socket.on("log", (data) => {
      setItems((items) => [...items, data]);
    });
    socket.on("end", () => {
      onEnd?.();
    });
  }, [socket]);

  return <Static items={items}>{children}</Static>;
};
