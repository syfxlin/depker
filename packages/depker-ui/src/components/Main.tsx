import React, { ReactNode } from "react";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { Box, Title } from "@mantine/core";

export type MainProps = {
  title: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
};

export const Main: React.FC<MainProps> = ({ title, header, children }) => {
  const { u } = useU();
  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        margin-left: ${u.s(20)};
        min-height: 100vh;
      `}
    >
      <header
        css={css`
          padding: ${u.sp(6)} ${u.sp(8)} ${u.sp(3)};
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <Title
          order={2}
          css={css`
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
          padding: ${u.sp(4)};
        `}
      >
        {children}
      </Box>
    </Box>
  );
};
