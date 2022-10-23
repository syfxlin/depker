import useSWR from "swr";
import { client } from "./client";
import { useSetSWR } from "../hooks/use-set-swr";
import { useCallback } from "react";

export const useApp = (name: string) => {
  const query = useSWR(["client.app.get", name], () => client.app.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  const set = useSetSWR(query);

  const save = useCallback(async () => {
    const data = query.data;
    if (!data) {
      return undefined;
    }
    const app = await client.app.upsert({
      ...data,
      ports: data.ports.map((i) => ({
        name: i.name,
        port: i.cport,
      })),
      volumes: data.volumes.map((i) => ({
        name: i.name,
        path: i.cpath,
        readonly: i.readonly,
      })),
    });
    return await set(() => app);
  }, [query.data, set]);

  return {
    ...query,
    set,
    save,
  };
};
