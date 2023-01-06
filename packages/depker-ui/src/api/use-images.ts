import { usePageState } from "../hooks/use-page-state";
import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { CreateImageRequest, DeleteImageRequest } from "@syfxlin/depker-client";

export const useImages = () => {
  const page = usePageState({ page: 1, size: 10 });

  const query = useSWR(["client.images.list", page.request], (key, request) => client.images.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: CreateImageRequest) => {
        const response = await client.images.create(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeleteImageRequest) => {
        const response = await client.images.delete(request);
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
