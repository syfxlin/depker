import useSWR from "swr";
import { client } from "./client";
import { useCallback, useMemo } from "react";
import { ListVolumeResponse, UpsertVolumeRequest } from "@syfxlin/depker-client";

export const useAllVolumes = () => {
  const query = useSWR(["client.volume.all"], async () => {
    return await client.volume.list({ all: true });
  });

  const data = useMemo(() => {
    return (query.data?.items ?? []).reduce(
      (a, i) => ({ ...a, [i.name]: i }),
      {} as Record<string, ListVolumeResponse["items"][number]>
    );
  }, [query.data]);

  const mutate = useCallback(async () => {
    return await query.mutate();
  }, [query.mutate]);

  const create = useCallback(
    async (request: UpsertVolumeRequest) => {
      const response = await client.volume.upsert(request);
      await query.mutate();
      return response;
    },
    [query.mutate]
  );

  return { data, mutate, create };
};
