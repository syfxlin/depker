import { client } from "./client";
import { useEffect, useRef, useState } from "react";
import { LogsServiceDeployResponse } from "@syfxlin/depker-client";

export const useDeployLogs = (name: string, id: number | string | undefined) => {
  const latest = useRef<number>(0);
  const [logs, setLogs] = useState<LogsServiceDeployResponse["logs"] | null>(null);

  useEffect(() => {
    latest.current = 0;
    setLogs(null);
  }, [name, id, latest]);

  useEffect(() => {
    const fn = () => {
      if (!name || !id || latest.current < 0) {
        return;
      }
      (async () => {
        const response = await client.deploys.logs({
          name: name,
          id: typeof id === "number" ? id : parseInt(id),
          since: latest.current,
        });
        latest.current = response.since ?? latest.current;
        if (response.logs.length) {
          setLogs((prev) => [...(prev ?? []), ...response.logs]);
        }
      })();
    };
    const interval = window.setInterval(fn, 1000);
    return () => window.clearInterval(interval);
  }, [name, id, latest]);

  return {
    empty: name && id ? (logs ? "No Logs." : "Loading...") : "Select a deploy to see the logs.",
    data: logs ?? [],
  };
};
