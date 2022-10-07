import useSWR from "swr";
import { client } from "./client";

export const useAccessLogs = () => {
  const query = useSWR(["client.system.logs"], () => client.system.logs(), { refreshInterval: 5000 });
  return { ...query };
};
