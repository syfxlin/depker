import useSWR from "swr";
import { client } from "./client";
import { ServiceStatus } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const colors: Record<ServiceStatus, string> = {
  stopped: "pink",
  running: "green",
  restarting: "blue",
  exited: "red",
};

export const useStatus = (name: string) => {
  const query = useSWR(["client.services.status", name], (key, name) => client.services.status({ name }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v?.status ?? "stopped",
    () => ({})
  );
};
