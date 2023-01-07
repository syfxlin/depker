import React from "react";
import { useTailLogs } from "../../hooks/use-tail-logs";
import { useContainerLogs } from "../../api/use-container-logs";
import { NumberInput } from "@mantine/core";
import { TbListNumbers } from "react-icons/all";
import { Logs } from "../core/Logs";

export type ContainerLogsProps = {
  name: string;
};

export const ContainerLogs: React.FC<ContainerLogsProps> = ({ name }) => {
  const tail = useTailLogs(1000);
  const logs = useContainerLogs(name, tail.debounced);
  return (
    <Logs title="Container Logs" empty={logs.empty} data={logs.data}>
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
