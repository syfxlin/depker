import React from "react";
import { Grid } from "@mantine/core";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { css } from "@emotion/react";
import { DeployLogs } from "../components/parts/DeployLogs";
import { DeployList } from "../components/parts/DeployList";
import { Tab } from "../components/layout/Tab";

export const ServiceDeploysTab: React.FC = () => {
  const { service, deploy } = useParams<"service" | "deploy">();

  return (
    <Tab>
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
          <DeployLogs service={service!} id={deploy!} />
        </Grid.Col>
        <Grid.Col span={4}>
          <DeployList service={service!} />
        </Grid.Col>
      </Grid>
    </Tab>
  );
};
