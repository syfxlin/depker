import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { GetPluginSettingResponse } from "@syfxlin/depker-client";

export const usePlugin = (name: string) => {
  const query = useSWR(["client.plugins.get", name], () => client.plugins.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      update: async (fn: (prev: GetPluginSettingResponse["values"]) => GetPluginSettingResponse["values"]) => {
        return await q.mutate((prev) => (prev ? { options: prev.options, values: fn(prev.values) } : prev), false);
      },
      save: async () => {
        let error: any = null;
        const result = await q.mutate(async (value) => {
          if (!value) {
            return value;
          }
          try {
            return await client.plugins.set({ name, values: value.values });
          } catch (e) {
            error = e;
            return value;
          }
        }, false);
        if (error) {
          throw error;
        }
        return result;
      },
    })
  );
};
