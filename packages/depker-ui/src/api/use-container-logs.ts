import { useEffect, useState } from "react";
import { client } from "./client";
import { LogLevel } from "@syfxlin/depker-client";
import { DateTime } from "luxon";

export const useContainerLogs = (name: string, tail: number) => {
  const [logs, setLogs] = useState<Array<[LogLevel, number, string]> | null>(null);

  useEffect(() => {
    setLogs(null);
    const socket = client.containers.logs({ name, tail });

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
  }, [name, tail]);

  return {
    empty: name && logs ? "No Logs." : "Loading...",
    data: logs ?? [],
  };
};
