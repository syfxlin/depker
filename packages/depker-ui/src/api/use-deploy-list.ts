import { usePageState } from "../hooks/use-page-state";
import useSWR from "swr";
import { client } from "./client";
import { DeployStatus } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const colors: Record<DeployStatus, string> = {
  queued: "blue",
  running: "orange",
  success: "green",
  failed: "red",
};

export const useDeployList = (name: string) => {
  const page = usePageState({ page: 1, size: 5 });

  const query = useSWR(
    ["client.deploys.list", name, page.request],
    (key, name, request) => client.deploys.list({ ...request, name }),
    {
      refreshInterval: 1000,
    }
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
