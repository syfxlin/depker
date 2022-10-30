import { SWRResponse } from "swr";
import { useMemo } from "react";

export const useSWRWrapper = <T, R, A>(
  query: SWRResponse<T>,
  dataFn: (value: T | undefined) => R,
  actionFn: (query: SWRResponse<T>) => A
) => {
  const loading = useMemo(() => !query.error && !query.data, [query.data, query.error]);
  const data = useMemo(() => dataFn(query.data), [query.data]);
  const actions = useMemo(() => actionFn(query), [query]);
  return { query, data, loading, actions };
};
