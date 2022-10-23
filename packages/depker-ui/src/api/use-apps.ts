import useSWR from "swr";
import { client } from "./client";
import { usePageState } from "../hooks/use-page-state";

export const useApps = () => {
  const page = usePageState();

  const query = useSWR(["client.app.list", page.request], async (key, request) => {
    return await client.app.list(request);
  });

  return {
    ...query,
    ...page,
  };
};
