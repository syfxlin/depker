import useSWR from "swr";
import { client } from "./client";

export const useMetrics = () => {
  const query = useSWR(["client.system.metrics"], () => client.system.metrics(), { refreshInterval: 5000 });
  return { ...query };
};
