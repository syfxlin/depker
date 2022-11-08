import React from "react";
import { useParams } from "react-router-dom";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { NumberInput, Stack } from "@mantine/core";
import { useAppLogs } from "../api/use-app-logs";
import { Logs } from "../components/core/Logs";
import { TbListNumbers } from "react-icons/all";
import { useTailLogs } from "../hooks/use-tail-logs";

export const AppLogsTab: React.FC = () => {
  const { app } = useParams<"app">();
  const tail = useTailLogs(1000);
  const logs = useAppLogs(app!, tail.debounced);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Application Logs</Heading>
      <Logs title="Application Logs" empty={logs.empty} data={logs.data}>
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
