import { useEffect, useRef, useState } from "react";
import { client } from "./client";
import { LogsAppResponse } from "@syfxlin/depker-client";

export const useAppLogs = (name: string) => {
  const latest = useRef<number>(0);
  const [logs, setLogs] = useState<LogsAppResponse["logs"] | null>(null);

  useEffect(() => {
    latest.current = 0;
    setLogs(null);
  }, [name, latest]);

  useEffect(() => {
    const fn = () => {
      if (!name || latest.current < 0) {
        return;
      }
      (async () => {
        const response = await client.app.logs({
          name: name,
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
  }, [name, latest]);

  return {
    empty: name && logs ? "No Logs." : "Loading...",
    data: logs ?? [],
  };
};
