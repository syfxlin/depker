import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import useSWR from "swr";
import { client } from "./client";

export const useApps = () => {
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(12);
  const [sort, setSort] = useState<[string, "asc" | "desc"]>(["", "asc"]);

  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 1000);

  const query = useSWR(["client.app.list", page, size, sort, debounced], (key, page, size, sort, search) => {
    return client.app.list({
      offset: (page - 1) * size,
      limit: size,
      sort: sort[0] ? sort.join(":") : undefined,
      search: search ? search : undefined,
    });
  });

  const status = useSWR(["client.app.status", query.data?.items?.map((i) => i.name)], (key, names) => {
    return client.app.status({
      names: names ?? [],
    });
  });

  return {
    ...query,
    status: status.data ?? {},
    page,
    size,
    sort,
    search,
    setPage,
    setSize,
    setSort,
    setSearch,
  };
};
