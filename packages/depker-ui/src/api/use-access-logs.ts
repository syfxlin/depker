import useSWR from "swr";
import { client } from "./client";

export const useAccessLogs = () => {
  return useSWR(["client.system.logs"], () => client.system.logs(), { refreshInterval: 5000 });
};
