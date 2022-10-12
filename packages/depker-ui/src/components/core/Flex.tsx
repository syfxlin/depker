import React, { forwardRef } from "react";
import { Box, BoxProps } from "@mantine/core";
import { css } from "@emotion/react";

export type FlexProps = BoxProps;

export const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  return (
    <Box
      {...props}
      ref={ref}
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
      `}
    >
      {props.children}
    </Box>
  );
});
