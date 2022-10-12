import React, { ReactNode } from "react";
import { css } from "@emotion/react";
import { Box, Title, useMantineTheme } from "@mantine/core";

export type MainProps = {
  title: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
};

export const Main: React.FC<MainProps> = ({ title, header, children }) => {
  const t = useMantineTheme();
  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        margin-left: 80px;
        min-height: 100vh;
      `}
    >
      <header
        css={css`
          padding: ${t.spacing.lg}px ${t.spacing.xl}px ${t.spacing.xs}px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <Title
          order={2}
          css={css`
            font-weight: 500;
            line-height: 1;
            vertical-align: middle;
          `}
        >
          {title}
        </Title>
        {header}
      </header>
      <Box
        css={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: ${t.spacing.md}px;
        `}
      >
        {children}
      </Box>
    </Box>
  );
};
