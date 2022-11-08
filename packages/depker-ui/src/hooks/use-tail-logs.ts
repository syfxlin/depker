import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export const useTailLogs = (initial?: number) => {
  const [tail, setTail] = useState<number | undefined>(initial);
  const [debounced] = useDebouncedValue(tail ?? 0, 500);
  return { debounced, value: tail, update: setTail };
};
