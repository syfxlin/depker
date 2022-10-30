import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useMetrics = () => {
  const query = useSWR(["client.system.metrics"], () => client.system.metrics(), { refreshInterval: 5000 });
  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({ mutate: q.mutate })
  );
};
