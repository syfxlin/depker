import React, { ReactNode, useEffect, useState } from "react";
import { Static } from "ink";

export type LoggerProps = {
  stream: NodeJS.ReadableStream;
  onData?: (data: LoggerData) => void;
  onEnd?: (items: LoggerData[]) => void;
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
      onData?.(data.value);
    });
  }, [stream]);

  useEffect(() => {
    const fn = () => {
      onEnd?.(items);
    };
    stream.on("end", fn);
    return () => {
      stream.off("end", fn);
    };
  }, [items]);

  return <Static items={items}>{children}</Static>;
};
