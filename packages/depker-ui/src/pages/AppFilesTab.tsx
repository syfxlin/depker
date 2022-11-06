import React from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";

export const AppFilesTab: React.FC = () => {
  const { app } = useParams<"app">();
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Application Files</Heading>
      <iframe
        title="Application Files"
        src="http://localhost:3000/files/fs/volumes/"
        css={css`
          flex: 1;
          border: 0;
        `}
      />
    </Stack>
  );
};
