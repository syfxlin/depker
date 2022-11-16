import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { CreateVolumeRequest, DeleteVolumeRequest } from "@syfxlin/depker-client";

export const useVolumes = () => {
  const query = useSWR(["client.volumes.list"], async () => {
    return await client.volumes.list();
  });

  return useSWRWrapper(
    query,
    (v) => v ?? [],
    (q) => ({
      create: async (request: CreateVolumeRequest) => {
        const response = await client.volumes.create(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeleteVolumeRequest) => {
        const response = await client.volumes.delete(request);
        await q.mutate();
        return response;
      },
    })
  );
};
