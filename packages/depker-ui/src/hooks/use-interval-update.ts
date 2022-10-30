import { useForceUpdate, useInterval } from "@mantine/hooks";
import { useEffect } from "react";

export const useIntervalUpdate = (ms: number) => {
  const update = useForceUpdate();

  const interval = useInterval(() => update(), ms);

  useEffect(() => {
    interval.start();
    return () => interval.stop();
  }, []);

  return update;
};
