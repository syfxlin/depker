import useSWR from "swr";
import { client } from "./client";
import { ListVolumeResponse, UpsertVolumeRequest } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAllVolumes = () => {
  const query = useSWR(["client.volume.all"], async () => {
    return await client.volume.list({ all: true });
  });

  return useSWRWrapper(
    query,
    (v) =>
      (v?.items ?? []).reduce(
        (a, i) => ({ ...a, [i.name]: i }),
        {} as Record<string, ListVolumeResponse["items"][number]>
      ),
    (q) => ({
      create: async (request: UpsertVolumeRequest) => {
        const response = await client.volume.upsert(request);
        await q.mutate();
        return response;
      },
    })
  );
};
