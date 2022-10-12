import useSWR from "swr";
import { client } from "./client";
import { useMemo } from "react";
import { BuildPacksAppResponse } from "@syfxlin/depker-client";

export const useBuildpacks = () => {
  const query = useSWR(["client.app.buildpacks"], () => {
    return client.app.buildpacks();
  });

  return useMemo(
    () => new Map<string, BuildPacksAppResponse[number]>((query.data ?? []).map((i) => [i.name, i])),
    [query.data]
  );
};
