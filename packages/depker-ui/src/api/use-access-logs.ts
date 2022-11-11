import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAccessLogs = (tail: number) => {
  const query = useSWR(["client.system.logs", tail], (key, lines) => client.system.logs({ lines }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
