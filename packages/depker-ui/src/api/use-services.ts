import useSWR from "swr";
import { client } from "./client";
import { usePageState } from "../hooks/use-page-state";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { UpsertServiceRequest } from "@syfxlin/depker-client";

export const useServices = () => {
  const page = usePageState({ page: 1, size: 15 });

  const query = useSWR(["client.services.list", page.request], (key, request) => client.services.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      create: async (request: UpsertServiceRequest) => {
        const response = await client.services.create(request);
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
