import React from "react";
import { Grid, Stack } from "@mantine/core";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { css } from "@emotion/react";
import { DeployLogs } from "../components/parts/DeployLogs";
import { DeployList } from "../components/parts/DeployList";

export const AppDeploysTab: React.FC = () => {
  const { app, deploy } = useParams<"app" | "deploy">();

  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Deploy Logs</Heading>
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
          <DeployLogs id={deploy!} />
        </Grid.Col>
        <Grid.Col span={4}>
          <DeployList app={app!} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
