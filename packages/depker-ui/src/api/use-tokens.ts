import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { usePageState } from "../hooks/use-page-state";
import { DeleteTokenRequest, UpsertTokenRequest } from "@syfxlin/depker-client";

export const useTokens = () => {
  const page = usePageState({ page: 1, size: 10 });

  const query = useSWR(["client.tokens.list", page.request], (key, request) => client.tokens.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: UpsertTokenRequest) => {
        const response = await client.tokens.create(request);
        await q.mutate();
        return response;
      },
      update: async (request: UpsertTokenRequest) => {
        const response = await client.tokens.update(request);
        await q.mutate();
        return response;
      },
      delete: async (request: DeleteTokenRequest) => {
        const response = await client.tokens.delete(request);
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
