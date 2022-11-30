import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { GetSettingResponse } from "@syfxlin/depker-client";

export const useSettings = () => {
  const query = useSWR(["client.settings.get"], async () => {
    return await client.settings.get();
  });

  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      update: async (fn: (prev: GetSettingResponse) => GetSettingResponse) => {
        return await q.mutate((prev) => (prev ? fn(prev) : prev), false);
      },
      save: async () => {
        return await q.mutate(async (value) => {
          if (!value) {
            return value;
          }
          return client.settings.update(value);
        }, false);
      },
    })
  );
};
