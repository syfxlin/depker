import { Box, Pagination, useMantineTheme } from "@mantine/core";
import React, { ReactNode } from "react";
import { css } from "@emotion/react";

export type PagesProps = {
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
  children: ReactNode;
};

export const Pages: React.FC<PagesProps> = ({ children, page, size, total, onChange }) => {
  const t = useMantineTheme();
  return (
    <>
      <Box
        css={css`
          flex: 1;
        `}
      >
        {children}
      </Box>
      <Pagination
        page={page}
        total={Math.max(1, Math.ceil(total / size))}
        withEdges
        withControls
        position="center"
        onChange={onChange}
        css={css`
          margin-top: ${t.spacing.md}px;
          margin-bottom: ${t.spacing.md}px;
        `}
      />
    </>
  );
};
