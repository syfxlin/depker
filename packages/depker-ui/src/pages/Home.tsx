import React from "react";
import { Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Metrics } from "../components/Metrics";
import { AccessLogs } from "../components/AccessLogs";
import { Main } from "../components/Main";

export const Home: React.FC = () => {
  return (
    <Main title="Home">
      <Stack
        css={css`
          flex: 1;
          display: flex;
          flex-direction: column;
        `}
      >
        <Metrics />
        <AccessLogs />
      </Stack>
    </Main>
  );
};
