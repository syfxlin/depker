import useSWR from "swr";
import { client } from "./client";
import { ListPortResponse, UpsertPortRequest } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useAllPorts = () => {
  const query = useSWR(["client.port.all"], async () => {
    return await client.ports.list({ all: true });
  });

  return useSWRWrapper(
    query,
    (v) =>
      (v?.items ?? []).reduce(
        (a, i) => ({ ...a, [i.name]: i }),
        {} as Record<string, ListPortResponse["items"][number]>
      ),
    (q) => ({
      create: async (request: UpsertPortRequest) => {
        const response = await client.ports.create(request);
        await q.mutate();
        return response;
      },
    })
  );
};
