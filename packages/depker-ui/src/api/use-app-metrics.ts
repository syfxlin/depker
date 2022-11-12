import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAppMetrics = (name: string) => {
  const query = useSWR(["client.apps.metrics", name], (key, name) => client.apps.metrics({ name }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v,
    () => ({})
  );
};
