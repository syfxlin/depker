import React from "react";
import { useParams } from "react-router-dom";
import { Grid, Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { CronLogs } from "../components/parts/CronLogs";
import { CronList } from "../components/parts/CronList";

export const ServiceCronsTab: React.FC = () => {
  const { service, cron } = useParams<"service" | "cron">();

  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Cron Logs</Heading>
      <Grid
        css={css`
          flex: 1;

          .mantine-Col-root {
            display: flex;
            flex-direction: column;
            flex: 1;
          }
        `}
      >
        <Grid.Col span={8}>
          <CronLogs service={service!} id={cron!} />
        </Grid.Col>
        <Grid.Col span={4}>
          <CronList service={service!} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
