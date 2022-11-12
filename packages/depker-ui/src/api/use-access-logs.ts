import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAccessLogs = (tail: number) => {
  const query = useSWR(["client.systems.logs", tail], (key, lines) => client.systems.logs({ lines }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
