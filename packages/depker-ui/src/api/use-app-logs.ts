import { useEffect, useRef, useState } from "react";
import { client } from "./client";
import { LogsAppResponse } from "@syfxlin/depker-client";

export const useAppLogs = (name: string, tail: number) => {
  const latest = useRef<number>(0);
  const [logs, setLogs] = useState<LogsAppResponse["logs"] | null>(null);

  useEffect(() => {
    latest.current = 0;
    setLogs(null);
  }, [name, tail, latest]);

  useEffect(() => {
    const fn = () => {
      if (!name || latest.current < 0) {
        return;
      }
      (async () => {
        const response = await client.apps.logs({
          name: name,
          tail: tail <= 0 ? undefined : tail,
          since: latest.current,
        });
        latest.current = response.since ?? latest.current;
        if (response.logs.length) {
          setLogs((prev) => {
            const data = [...(prev ?? []), ...response.logs];
            if (tail <= 0 || data.length - tail <= 0) {
              return data;
            } else {
              return data.slice(Math.max(0, data.length - tail));
            }
          });
        }
      })();
    };
    const interval = window.setInterval(fn, 1000);
    return () => window.clearInterval(interval);
  }, [name, tail, latest]);

  return {
    empty: name && logs ? "No Logs." : "Loading...",
    data: logs ?? [],
  };
};
