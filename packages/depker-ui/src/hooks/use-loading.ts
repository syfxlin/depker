import { useCallback, useState } from "react";

export const useLoading = () => {
  const [value, setValue] = useState(false);

  const wrap = useCallback(
    async <T>(promise: Promise<T>) => {
      setValue(true);
      try {
        return await promise;
      } finally {
        setValue(false);
      }
    },
    [setValue]
  );

  return { value, set: setValue, wrap };
};
