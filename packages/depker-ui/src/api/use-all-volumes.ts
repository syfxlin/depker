import useSWR from "swr";
import { client } from "./client";
import { useCallback, useMemo } from "react";
import { ListVolumeResponse } from "@syfxlin/depker-client";

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

  const mutate = useCallback(() => {
    return query.mutate();
  }, [query.mutate]);

  return { data, mutate };
};
