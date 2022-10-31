import { client } from "./client";
import { useEffect, useRef } from "react";
import { useListState } from "@mantine/hooks";
import { LogsDeployResponse } from "@syfxlin/depker-client";

export const useDeployLogs = (id: number | string | undefined) => {
  const latest = useRef<number>(0);
  const [items, handlers] = useListState<LogsDeployResponse["logs"][number]>([]);

  useEffect(() => {
    latest.current = 0;
    handlers.setState([]);
  }, [id, latest]);

  useEffect(() => {
    const fn = () => {
      if (!id || latest.current < 0) {
        return;
      }
      (async () => {
        const response = await client.deploy.logs({
          id: typeof id === "number" ? id : parseInt(id),
          since: latest.current,
        });
        if (["queued", "running"].includes(response.status)) {
          latest.current = response.logs[response.logs.length - 1][0] + 1;
        } else {
          latest.current = -1;
        }
        handlers.append(...response.logs);
      })();
    };
    const interval = window.setInterval(fn, 1000);
    return () => window.clearInterval(interval);
  }, [id, latest]);

  return items;
};
