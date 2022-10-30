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

export const useDeployList = (app: string) => {
  const page = usePageState();

  const query = useSWR(
    ["client.deploy.list", app, page.request],
    async (key, app, request) => {
      return await client.deploy.list({ ...request, app });
    },
    {
      refreshInterval: 1000,
    }
  );

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({ mutate: q.mutate })
  );

  return {
    ...result,
    ...page,
  };
};
