import React from "react";
import { Logs } from "../core/Logs";
import { useAccessLogs } from "../../api/use-access-logs";
import { useTailLogs } from "../../hooks/use-tail-logs";
import { TbListNumbers } from "react-icons/all";
import { NumberInput } from "@mantine/core";

export const AccessLogs: React.FC = () => {
  const tail = useTailLogs(1000);
  const logs = useAccessLogs(tail.debounced);
  return (
    <Logs title="Access Logs" empty={logs.empty} data={logs.data}>
      <NumberInput
        size="xs"
        min={0}
        max={100000}
        step={100}
        label="Tail Logs"
        description="Number of lines to show from the end of the logs."
        placeholder="Tail Logs"
        icon={<TbListNumbers />}
        value={tail.value}
        onChange={tail.update}
      />
    </Logs>
  );
};
