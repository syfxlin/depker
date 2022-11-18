import { client } from "./client";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { LogLevel } from "@syfxlin/depker-client";

export const useAccessLogs = (tail: number) => {
  const [logs, setLogs] = useState<Array<[LogLevel, number, string]> | null>(null);

  useEffect(() => {
    setLogs(null);
    const socket = client.systems.logs(tail);

    socket.on("disconnect", () => {
      setLogs((prev) => [...(prev ?? []), ["error", DateTime.utc().valueOf(), `Logs stopped.`]]);
    });
    socket.on("error", (data) => {
      setLogs((prev) => [...(prev ?? []), ["error", DateTime.utc().valueOf(), `Logs error: ${data}`]]);
    });
    socket.on("connect_error", (err) => {
      setLogs((prev) => [...(prev ?? []), ["error", DateTime.utc().valueOf(), `Logs connect error: ${err.message}`]]);
    });

    socket.on("data", (item) => {
      setLogs((prev) => [...(prev ?? []), item]);
    });

    return () => {
      socket.disconnect();
    };
  }, [tail]);

  return {
    empty: logs ? "No Logs." : "Loading...",
    data: logs ?? [],
  };
};
