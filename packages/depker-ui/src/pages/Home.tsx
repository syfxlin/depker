import React from "react";
import { Button, Group, Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Metrics } from "../components/Metrics";
import { AccessLogs } from "../components/AccessLogs";
import { Main } from "../components/layout/Main";
import { SiGithub } from "react-icons/all";

export const Home: React.FC = () => {
  return (
    <Main
      title="Home"
      header={
        <Group>
          <Button leftIcon={<SiGithub />} onClick={() => window.open("https://github.com/syfxlin/depker")}>
            GitHub
          </Button>
        </Group>
      }
    >
      <Stack
        css={css`
          flex: 1;
        `}
      >
        <Metrics />
        <AccessLogs />
      </Stack>
    </Main>
  );
};
