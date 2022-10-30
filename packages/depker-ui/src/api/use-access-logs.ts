import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAccessLogs = () => {
  const query = useSWR(["client.system.logs"], () => client.system.logs(), { refreshInterval: 5000 });
  return useSWRWrapper(
    query,
    (v) => v ?? [],
    (q) => ({ mutate: q.mutate })
  );
};
