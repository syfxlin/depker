import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { CreatePortRequest, DeletePortRequest } from "@syfxlin/depker-client";

export const usePorts = () => {
  const query = useSWR(["client.ports.list"], async () => {
    return await client.ports.list();
  });

  return useSWRWrapper(
    query,
    (v) => v ?? [],
    (q) => ({
      create: async (request: CreatePortRequest) => {
        const response = await client.ports.create(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeletePortRequest) => {
        const response = await client.ports.delete(request);
        await q.mutate();
        return response;
      },
    })
  );
};
