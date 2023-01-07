import React, { ReactNode } from "react";
import { css } from "@emotion/react";
import { Stack } from "@mantine/core";

export type TabProps = {
  children?: ReactNode;
};

export const Tab: React.FC<TabProps> = ({ children }) => {
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      {children}
    </Stack>
  );
};
