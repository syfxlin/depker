import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { usePageState } from "../hooks/use-page-state";
import {
  ConnectPortRequest,
  DeletePortRequest,
  DisconnectPortRequest,
  UpsertPortRequest,
} from "@syfxlin/depker-client";

export const usePorts = () => {
  const page = usePageState({ page: 1, size: 10 });

  const query = useSWR(["client.ports.list", page.request], (key, request) => client.ports.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: UpsertPortRequest) => {
        const response = await client.ports.create(request);
        await q.mutate();
        return response;
      },
      update: async (request: UpsertPortRequest) => {
        const response = await client.ports.update(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeletePortRequest) => {
        const response = await client.ports.delete(request);
        await q.mutate();
        return response;
      },
      connect: async (request: ConnectPortRequest) => {
        const response = await client.ports.connect(request);
        await q.mutate();
        return response;
      },
      disconnect: async (request: DisconnectPortRequest) => {
        const response = await client.ports.disconnect(request);
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
