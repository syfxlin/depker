import { useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export const usePageState = () => {
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(15);
  const [sort, setSort] = useState<[string, "asc" | "desc"]>(["", "asc"]);

  const [search, setSearch] = useState<string>("");
  const [debounced] = useDebouncedValue(search, 1000);

  const request = useMemo(
    () => ({
      offset: (page - 1) * size,
      limit: size,
      sort: sort[0] ? sort.join(":") : undefined,
      search: search ? search : undefined,
    }),
    [page, size, sort, debounced]
  );

  return {
    page,
    size,
    sort,
    search,
    request,
    setPage,
    setSize,
    setSort,
    setSearch,
  };
};
