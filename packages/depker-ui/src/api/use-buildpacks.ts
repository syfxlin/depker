import useSWR from "swr";
import { client } from "./client";
import { ListBuildPackResponse } from "@syfxlin/depker-client";
import { useSWRWrapper } from "../hooks/use-swr-wrapper";

export const useBuildpacks = () => {
  const query = useSWR(["client.buildpacks.list"], () => client.buildpacks.list());
  return useSWRWrapper(
    query,
    (v) => (v ?? []).reduce((a, i) => ({ ...a, [i.name]: i }), {} as Record<string, ListBuildPackResponse[number]>),
    () => ({})
  );
};
