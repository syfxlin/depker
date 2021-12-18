import { DependencyList, useCallback, useEffect, useState } from "react";

export type AsyncState<D = any> = {
  status: "loading" | "success" | "error";
  data: D | null;
  error: Error | null;
};

export const useAsync = <D = any>(
  fn: () => Promise<D>,
  deps: DependencyList = []
) => {
  const [state, setState] = useState<AsyncState<D>>({
    status: "loading",
    data: null,
    error: null,
  });

  const execute = useCallback(() => {
    setState({
      status: "loading",
      data: null,
      error: null,
    });
    fn()
      .then((data) => {
        setState({
          status: "success",
          data,
          error: null,
        });
      })
      .catch((error) => {
        setState({
          status: "error",
          data: null,
          error,
        });
      });
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
  };
};
