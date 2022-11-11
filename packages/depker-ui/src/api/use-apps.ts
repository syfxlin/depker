import useSWR from "swr";
import { client } from "./client";
import { usePageState } from "../hooks/use-page-state";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { UpsertAppRequest } from "@syfxlin/depker-client";

export const useApps = () => {
  const page = usePageState({ page: 1, size: 15 });

  const query = useSWR(["client.app.list", page.request], (key, request) => client.app.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: UpsertAppRequest) => {
        const response = await client.app.create(request);
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
