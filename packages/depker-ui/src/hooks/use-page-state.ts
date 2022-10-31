import { useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export type UsePageStateProps = {
  page?: number;
  size?: number;
  sort?: [string, "asc" | "desc"];
  search?: string;
};

export const usePageState = (initial?: UsePageStateProps) => {
  const [page, setPage] = useState<number>(initial?.page ?? 1);
  const [size, setSize] = useState<number>(initial?.size ?? 10);
  const [sort, setSort] = useState<[string, "asc" | "desc"]>(initial?.sort ?? ["", "asc"]);

  const [search, setSearch] = useState<string>(initial?.search ?? "");
  const [debounced] = useDebouncedValue(search, 1000);

  const values = useMemo(
    () => ({
      page,
      size,
      sort,
      search,
    }),
    [page, size, sort, search]
  );

  const request = useMemo(
    () => ({
      offset: (page - 1) * size,
      limit: size,
      sort: sort[0] ? sort.join(":") : undefined,
      search: debounced ? debounced : undefined,
    }),
    [page, size, sort, debounced]
  );

  const update = useMemo(
    () => ({
      page: setPage,
      size: setSize,
      sort: setSort,
      search: setSearch,
    }),
    []
  );

  return { values, request, update };
};
