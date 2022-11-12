import { Alert, Box, Center, Pagination, useMantineTheme } from "@mantine/core";
import React, { ReactNode } from "react";
import { css } from "@emotion/react";
import { TbCircle } from "react-icons/all";

export type PagesProps = {
  page: number;
  size: number;
  total: number;
  siblings?: number;
  edges?: boolean;
  onChange: (page: number) => void;
  children: ReactNode;
};

export const Pages: React.FC<PagesProps> = ({ children, page, size, total, onChange, edges, siblings }) => {
  const t = useMantineTheme();
  return (
    <>
      <Box
        css={css`
          flex: 1;
          display: flex;
          flex-direction: column;
        `}
      >
        {total ? (
          children
        ) : (
          <Center>
            <Alert
              icon={<TbCircle />}
              color="gray"
              title="No Items"
              css={css`
                margin: 0 ${t.spacing.md}px;
                max-width: ${t.fontSizes.md * 25}px;
              `}
            >
              The list is empty.
            </Alert>
          </Center>
        )}
      </Box>
      <Pagination
        page={page}
        total={Math.max(1, Math.ceil(total / size))}
        withControls
        position="center"
        withEdges={edges}
        siblings={siblings}
        onChange={onChange}
        css={css`
          margin-top: ${t.spacing.md}px;
          margin-bottom: ${t.spacing.md}px;
        `}
      />
    </>
  );
};
