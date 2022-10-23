import useSWR from "swr";
import { client } from "./client";
import { useCallback, useMemo } from "react";
import { ListPortResponse, UpsertPortRequest } from "@syfxlin/depker-client";

export const useAllPorts = () => {
  const query = useSWR(["client.port.all"], async () => {
    return await client.port.list({ all: true });
  });

  const data = useMemo(() => {
    return (query.data?.items ?? []).reduce(
      (a, i) => ({ ...a, [i.name]: i }),
      {} as Record<string, ListPortResponse["items"][number]>
    );
  }, [query.data]);

  const mutate = useCallback(async () => {
    return await query.mutate();
  }, [query.mutate]);

  const create = useCallback(
    async (request: UpsertPortRequest) => {
      const response = await client.port.upsert(request);
      await query.mutate();
      return response;
    },
    [query.mutate]
  );

  return { data, mutate, create };
};
