import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useVolumeBinds = (volume: string) => {
  const query = useSWR(["client.volumes.binds", volume], async () => {
    return await client.volumes.binds({ volume });
  });
  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
