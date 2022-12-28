import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { usePageState } from "../hooks/use-page-state";
import { InstallPluginRequest, UninstallPluginRequest } from "@syfxlin/depker-client";

export const usePlugins = () => {
  const page = usePageState({ page: 1, size: 15 });

  const query = useSWR(["client.plugins.list", page.request], async (key, request) => client.plugins.list(request));

  const result = useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      install: async (request: InstallPluginRequest) => {
        const response = await client.plugins.install(request);
        await q.mutate();
        return response;
      },
      uninstall: async (request: UninstallPluginRequest) => {
        const response = await client.plugins.uninstall(request);
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
