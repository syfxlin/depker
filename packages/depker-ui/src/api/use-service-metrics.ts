import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useServiceMetrics = (name: string) => {
  const query = useSWR(["client.services.metrics", name], (key, name) => client.services.metrics({ name }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v,
    () => ({})
  );
};
