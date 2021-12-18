import { useLayoutEffect, useState } from "react";
import { useApp } from "ink";
import { AsyncState } from "./use-async";

export const useEnd = (end: boolean | Error | null | undefined) => {
  const { exit } = useApp();

  useLayoutEffect(() => {
    if (typeof end === "boolean") {
      if (end) {
        exit();
      }
    } else if (end) {
      exit(end);
    }
  }, [end]);
};

export const useAsyncEnd = (state: AsyncState) => {
  return useEnd(
    state.status === "success" || (state.status === "error" && state.error)
  );
};

export const useEndFn = () => {
  const [end, setEnd] = useState(false);

  useEnd(end);

  return () => setEnd(true);
};
