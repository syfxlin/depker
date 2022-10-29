import useSWR from "swr";
import { client } from "./client";
import { useSetSWR } from "../hooks/use-set-swr";
import { useSaveSWR } from "../hooks/use-save-swr";

export const useApp = (name: string) => {
  const query = useSWR(["client.app.get", name], (key, name) => client.app.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  const set = useSetSWR(query);
  const save = useSaveSWR(query, (value) => {
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
  });

  return {
    ...query,
    set,
    save,
  };
};
