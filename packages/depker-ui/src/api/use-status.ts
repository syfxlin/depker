import useSWR from "swr";
import { client } from "./client";
import { AppStatus } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const colors: Record<AppStatus, string> = {
  stopped: "pink",
  running: "green",
  restarting: "blue",
  exited: "red",
};

export const useStatus = (name: string) => {
  const query = useSWR(["client.apps.status", name], (key, name) => client.apps.status({ name }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v?.status ?? "stopped",
    () => ({})
  );
};
