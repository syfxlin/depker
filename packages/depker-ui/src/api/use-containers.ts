import { usePageState } from "../hooks/use-page-state";
import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { DeleteContainerRequest, OperateContainerRequest, RenameContainerRequest } from "@syfxlin/depker-client";

export const useContainers = () => {
  const page = usePageState({ page: 1, size: 10 });

  const query = useSWR(["client.containers.list", page.request], (key, request) => client.containers.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      // create: async (request: CreateImageRequest) => {
      //   const response = await client.images.create(request);
      //   await q.mutate();
      //   return response;
      // },
      delete: async (request: DeleteContainerRequest) => {
        const response = await client.containers.delete(request);
        await q.mutate();
        return response;
      },
      rename: async (request: RenameContainerRequest) => {
        const response = await client.containers.rename(request);
        await q.mutate();
        return response;
      },
      start: async (request: OperateContainerRequest) => {
        const response = await client.containers.start(request);
        await q.mutate();
        return response;
      },
      restart: async (request: OperateContainerRequest) => {
        const response = await client.containers.restart(request);
        await q.mutate();
        return response;
      },
      stop: async (request: OperateContainerRequest) => {
        const response = await client.containers.stop(request);
        await q.mutate();
        return response;
      },
      kill: async (request: OperateContainerRequest) => {
        const response = await client.containers.kill(request);
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
