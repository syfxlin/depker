import useSWR from "swr";
import { client } from "./client";
import { useMemo } from "react";
import { StatusAppResponse } from "@syfxlin/depker-client";

export const colors = {
  stopped: "pink",
  running: "green",
  restarting: "blue",
  exited: "red",
};

export const useStatus = (names: string[]) => {
  const query = useSWR(["client.app.status", names], (key, names) => {
    return client.app.status({ names });
  });

  return useMemo(() => new Map<string, StatusAppResponse[string]>(Object.entries(query.data ?? {})), [query.data]);
};
