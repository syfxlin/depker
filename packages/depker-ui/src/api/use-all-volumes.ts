import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAllVolumes = () => {
  const query = useSWR(["client.volumes.all"], async () => {
    return await client.volumes.list();
  });

  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
