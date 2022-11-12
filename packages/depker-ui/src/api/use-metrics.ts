import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useMetrics = () => {
  const query = useSWR(["client.systems.metrics"], () => client.systems.metrics(), { refreshInterval: 5000 });
  return useSWRWrapper(
    query,
    (v) => v,
    () => ({})
  );
};
