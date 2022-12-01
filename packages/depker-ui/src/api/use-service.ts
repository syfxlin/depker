import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { GetServiceResponse } from "@syfxlin/depker-client";

export const useService = (name: string) => {
  const query = useSWR(["client.services.get", name], (key, name) => client.services.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      update: async (fn: (prev: GetServiceResponse) => GetServiceResponse) => {
        return await q.mutate((prev) => (prev ? fn(prev) : prev), false);
      },
      save: async () => {
        return await q.mutate(async (value) => {
          if (!value) {
            return value;
          }
          return client.services.update(value);
        }, false);
      },
      deploy: async () => {
        return await client.services.up({ name });
      },
      stop: async () => {
        return await client.services.down({ name });
      },
      restart: async () => {
        return await client.services.restart({ name });
      },
      delete: async () => {
        return await client.services.delete({ name });
      },
    })
  );
};
