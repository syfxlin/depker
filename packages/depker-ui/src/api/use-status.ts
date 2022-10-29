import useSWR from "swr";
import { client } from "./client";
import { useCallback, useMemo } from "react";
import { AppStatus } from "@syfxlin/depker-client";

export const colors: Record<AppStatus, string> = {
  stopped: "pink",
  running: "green",
  restarting: "blue",
  exited: "red",
};

export const useStatus = (name: string) => {
  const query = useSWR(
    ["client.app.status", name],
    (key, name) => {
      return client.app.status({ name });
    },
    {
      refreshInterval: 5000,
    }
  );

  const data = useMemo(() => {
    return query.data?.status ?? "stopped";
  }, [query.data]);

  const mutate = useCallback(() => {
    return query.mutate();
  }, [query.mutate]);

  return { data, mutate };
};
