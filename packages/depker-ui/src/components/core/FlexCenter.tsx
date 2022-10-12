import React, { forwardRef } from "react";
import { css } from "@emotion/react";
import { Center, CenterProps } from "@mantine/core";

export type FlexCenterProps = Partial<CenterProps>;

export const FlexCenter = forwardRef<HTMLDivElement, FlexCenterProps>((props, ref) => {
  return (
    <Center
      {...props}
      ref={ref}
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
      `}
    >
      {props.children}
    </Center>
  );
});
