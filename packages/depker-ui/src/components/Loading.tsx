import React, { PropsWithChildren } from "react";
import { Center, Loader, Text } from "@mantine/core";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";

export type LoadingProps = PropsWithChildren;

export const Loading: React.FC<LoadingProps> = ({ children }) => {
  const { u } = useU();
  return (
    <Center
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
      `}
    >
      <Loader variant="bars" />
      <Text
        css={css`
          margin: 0 ${u.sp(4)};
          color: ${u.c("gray.7", "gray.5")};
          max-width: 25rem;
          overflow-x: auto;
        `}
      >
        {children ?? "Loading..."}
      </Text>
    </Center>
  );
};
