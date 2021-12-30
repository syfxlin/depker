import { Writable } from "stream";

export const log = (stream: Writable) => {
  const info = (message?: any, data?: any) => {
    stream.write({
      level: "info",
      message,
      ...data,
    });
  };

  const warn = (message?: string, data?: any) => {
    stream.write({
      level: "warn",
      message,
      ...data,
    });
  };

  const error = (message?: string, data?: any) => {
    stream.write({
      level: "error",
      message,
      ...data,
    });
  };

  const verbose = (message?: string, data?: any) => {
    stream.write({
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
