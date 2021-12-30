import React, { ReactNode, useEffect, useState } from "react";
import { Static } from "ink";

export type LoggerProps = {
  stream: NodeJS.ReadableStream;
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
  stream,
  onData,
  onEnd,
  children,
}) => {
  const [items, setItems] = useState<LoggerData[]>([]);
  useEffect(() => {
    stream.on("data", (data) => {
      setItems((items) => [...items, data.value]);
      onData?.(data);
    });
    stream.on("end", () => {
      onEnd?.();
    });
  }, [stream]);

  return <Static items={items}>{children}</Static>;
};
