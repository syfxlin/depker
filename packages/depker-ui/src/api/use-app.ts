import useSWR from "swr";
import { client } from "./client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";
import { GetAppResponse } from "@syfxlin/depker-client";

export const useApp = (name: string) => {
  const query = useSWR(["client.app.get", name], (key, name) => client.app.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  return useSWRWrapper(
    query,
    (v) => v,
    (q) => ({
      update: async (fn: (prev: GetAppResponse) => GetAppResponse) => {
        return await q.mutate((prev) => (prev ? fn(prev) : prev), false);
      },
      save: async () => {
        return await q.mutate(async (value) => {
          if (!value) {
            return value;
          }
          return client.app.upsert({
            ...value,
            ports: value.ports.map((i) => ({
              name: i.name,
              port: i.cport,
            })),
            volumes: value.volumes.map((i) => ({
              name: i.name,
              path: i.cpath,
              readonly: i.readonly,
            })),
          });
        }, false);
      },
      deploy: async (force: boolean = false) => {
        return await client.app.up({ name, force });
      },
      stop: async () => {
        return await client.app.down({ name });
      },
      restart: async () => {
        return await client.app.restart({ name });
      },
    })
  );
};
