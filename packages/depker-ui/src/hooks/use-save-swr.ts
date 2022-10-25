import { SWRResponse } from "swr";
import { useCallback } from "react";

export const useSaveSWR = <T>(query: SWRResponse<T>, updater: (value: T) => Promise<T>) => {
  return useCallback(async () => {
    const data = query.data;
    if (!data) {
      return undefined;
    }
    const value = await updater(data);
    return await query.mutate(value, false);
  }, [query.data, query.mutate, updater]);
};
