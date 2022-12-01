import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { XTerm } from "../components/core/XTerm";
import { client } from "../api/client";

export const ServiceTerminalTab: React.FC = () => {
  const { service } = useParams<"service">();
  const socket = useMemo(() => () => client.services.terminal(service!), [service]);
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Service Terminal</Heading>
      <XTerm client={socket} />
    </Stack>
  );
};
