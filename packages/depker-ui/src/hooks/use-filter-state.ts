import { useCallback, useEffect, useState } from "react";
import { dequal } from "dequal";

export const useFilterState = <T>(
  value: Array<T>,
  setValue: (value: Array<T>) => void,
  filter: (value: T, index: number, array: Array<T>) => unknown
) => {
  const [data, setData] = useState(value);

  // update data from value
  useEffect(() => {
    setData((data) => {
      const v1 = data.filter(filter);
      const v2 = value.filter(filter);
      if (!dequal(v1, v2)) {
        return v2;
      }
      return data;
    });
  }, [value, setValue]);

  // update value from data
  const update = useCallback(
    (data: Array<T>) => {
      const v1 = data.filter(filter);
      const v2 = value.filter(filter);
      if (!dequal(v1, v2)) {
        setValue(v1);
      }
      setData(data);
    },
    [value, setValue]
  );

  return { value: data, update };
};
