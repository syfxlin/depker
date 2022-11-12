import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { XTerm } from "../components/core/XTerm";
import { client } from "../api/client";

export const AppTerminalTab: React.FC = () => {
  const { app } = useParams<"app">();
  const socket = useMemo(() => () => client.apps.terminal(app!), [app]);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Application Terminal</Heading>
      <XTerm client={socket} />
    </Stack>
  );
};
