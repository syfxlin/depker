import useSWR from "swr";
import { client } from "./client";

export const useMetrics = () => {
  return useSWR(["client.system.metrics"], () => client.system.metrics(), { refreshInterval: 5000 });
};
