import React, { useMemo } from "react";
import { client } from "../api/client";
import { Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { XTerm } from "../components/core/XTerm";

export const SettingShellTab: React.FC = () => {
  const socket = useMemo(() => () => client.systems.shell(), []);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Node Shell</Heading>
      <XTerm client={socket} />
    </Stack>
  );
};
