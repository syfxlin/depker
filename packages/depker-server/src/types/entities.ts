export type LogLevel = "debug" | "log" | "step" | "success" | "error";

export type LogFunc = {
  debug: (line: string) => void;
  log: (line: string) => void;
  step: (line: string) => void;
  success: (line: string) => void;
  error: (line: string, error?: Error) => void;
  upload: (level: LogLevel, line: string, error?: Error) => void;
};

export type DeployStatus = "queued" | "running" | "failed" | "success";
