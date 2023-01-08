import { useMemo } from "react";
import { client } from "./client";

export const useContainerTerminal = (name: string) => {
  return useMemo(() => () => client.containers.terminal({ name }), [name]);
};
