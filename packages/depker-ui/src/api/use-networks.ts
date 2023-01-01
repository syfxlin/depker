import { usePageState } from "../hooks/use-page-state";
import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import {
  ConnectNetworkRequest,
  CreateNetworkRequest,
  DeleteNetworkRequest,
  DisconnectNetworkRequest,
} from "@syfxlin/depker-client";

export const useNetworks = () => {
  const page = usePageState({ page: 1, size: 15 });

  const query = useSWR(["client.networks.list", page.request], async (key, request) => client.networks.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: CreateNetworkRequest) => {
        const response = await client.networks.create(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeleteNetworkRequest) => {
        const response = await client.networks.delete(request);
        await q.mutate();
        return response;
      },
      connect: async (request: ConnectNetworkRequest) => {
        const response = await client.networks.connect(request);
        await q.mutate();
        return response;
      },
      disconnect: async (request: DisconnectNetworkRequest) => {
        const response = await client.networks.disconnect(request);
        await q.mutate();
        return response;
      },
    })
  );

  return {
    ...result,
    ...page,
  };
};
