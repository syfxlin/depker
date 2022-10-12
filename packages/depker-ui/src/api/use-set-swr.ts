import { SWRResponse } from "swr";
import { useCallback } from "react";

export const useSetSWR = <T>(query: SWRResponse<T>) => {
  return useCallback(
    (value: (prev: T) => T) =>
      query.mutate((prev) => {
        if (prev) {
          return value(prev);
        }
      }, false),
    [query.mutate]
  );
};
