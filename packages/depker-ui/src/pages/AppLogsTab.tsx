import React from "react";
import { useParams } from "react-router-dom";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { Stack } from "@mantine/core";
import { useAppLogs } from "../api/use-app-logs";
import { Logs } from "../components/core/Logs";

export const AppLogsTab: React.FC = () => {
  const { app } = useParams<"app">();
  const logs = useAppLogs(app!);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Application Logs</Heading>
      <Logs title="Application Logs" empty={logs.empty} data={logs.data} />
    </Stack>
  );
};
