import useSWR from "swr";
import { client } from "./client";
import { useCallback, useMemo } from "react";
import { ListBuildPackResponse } from "@syfxlin/depker-client";

export const useAllBuildpacks = () => {
  const query = useSWR(["client.buildpack.list"], () => {
    return client.buildpack.list();
  });

  const data = useMemo(() => {
    return (query.data ?? []).reduce(
      (a, i) => ({ ...a, [i.name]: i }),
      {} as Record<string, ListBuildPackResponse[number]>
    );
  }, [query.data]);

  const mutate = useCallback(() => {
    return query.mutate();
  }, [query.mutate]);

  return { data, mutate };
};
