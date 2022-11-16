import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const usePortBinds = (port: number) => {
  const query = useSWR(["client.ports.binds", port], async () => {
    return await client.ports.binds({ port });
  });
  return useSWRWrapper(
    query,
    (v) => v ?? [],
    () => ({})
  );
};
