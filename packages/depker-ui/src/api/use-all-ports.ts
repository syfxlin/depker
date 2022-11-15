import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAllPorts = () => {
  const query = useSWR(["client.ports.all"], async () => {
    return await client.ports.list();
  });

  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
