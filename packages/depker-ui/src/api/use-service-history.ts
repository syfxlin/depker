import { usePageState } from "../hooks/use-page-state";
import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useServiceHistory = (name: string) => {
  const page = usePageState({ page: 1, size: 10 });

  const query = useSWR(["client.services.history", name, page.request], (key, name, request) =>
    client.services.history({ ...request, name })
  );

  const result = useSWRWrapper(
    query,
    (v) => v,
    () => ({})
  );

  return {
    ...result,
    ...page,
  };
};