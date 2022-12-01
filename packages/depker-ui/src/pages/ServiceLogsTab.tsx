import React from "react";
import { useParams } from "react-router-dom";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { NumberInput, Stack } from "@mantine/core";
import { useServiceLogs } from "../api/use-service-logs";
import { Logs } from "../components/core/Logs";
import { TbListNumbers } from "react-icons/all";
import { useTailLogs } from "../hooks/use-tail-logs";

export const ServiceLogsTab: React.FC = () => {
  const { service } = useParams<"service">();
  const tail = useTailLogs(1000);
  const logs = useServiceLogs(service!, tail.debounced);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Service Logs</Heading>
      <Logs title="Service Logs" empty={logs.empty} data={logs.data}>
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
    </Stack>
  );
};
