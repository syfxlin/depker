import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAppMetrics = (name: string) => {
  const query = useSWR(["client.app.metrics", name], (key, name) => client.app.metrics({ name }), {
    refreshInterval: 5000,
  });
  return useSWRWrapper(
    query,
    (v) => v,
    () => {}
  );
};
