import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { GetSettingResponse } from "@syfxlin/depker-client";

export const useSettings = () => {
  const query = useSWR(["client.settings.get"], () => client.settings.get(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      update: async (fn: (prev: GetSettingResponse) => GetSettingResponse) => {
        return await q.mutate((prev) => (prev ? fn(prev) : prev), false);
      },
      save: async () => {
        let error: any = null;
        const result = await q.mutate(async (value) => {
          if (!value) {
            return value;
          }
          try {
            return await client.settings.update(value);
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
