import { Box, Pagination } from "@mantine/core";
import React, { ReactNode } from "react";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";

export type PagesProps = {
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
  children: ReactNode;
};

export const Pages: React.FC<PagesProps> = ({ children, page, size, total, onChange }) => {
  const { u } = useU();
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
        withEdges={true}
        withControls={true}
        position="center"
        onChange={onChange}
        css={css`
          margin-top: ${u.sp(4)};
          margin-bottom: ${u.sp(4)};
        `}
      />
    </>
  );
};
