import React, { ReactNode, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Static } from "ink";

export type LoggerProps = {
  socket: Socket;
  onData?: (data: LoggerData) => void;
  onEnd?: () => void;
  children: (item: LoggerData, index: number) => ReactNode;
};

export type LoggerData = {
  level: "info" | "warn" | "error" | "verbose";
  message: string;
  [key: string]: any;
};

export const Logger: React.FC<LoggerProps> = ({
  socket,
  onData,
  onEnd,
  children,
}) => {
  const [items, setItems] = useState<LoggerData[]>([]);
  useEffect(() => {
    socket.on("connect_error", (err) => {
      const data: LoggerData = {
        level: "error",
        message: "Connect error!",
        error: err.message,
      };
      setItems((items) => [...items, data]);
      onData?.(data);
      onEnd?.();
    });
    socket.on("log", (data) => {
      setItems((items) => [...items, data]);
      onData?.(data);
    });
    socket.on("end", () => {
      onEnd?.();
    });
  }, [socket]);

  return <Static items={items}>{children}</Static>;
};
