import useSWR from "swr";
import { client } from "./client";
import { useSetSWR } from "../hooks/use-set-swr";

export const useApp = (name: string) => {
  const query = useSWR(["client.app.get", name], () => client.app.get({ name }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  const set = useSetSWR(query);

  return {
    ...query,
    set,
  };
};
