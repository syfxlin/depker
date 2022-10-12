import React, { forwardRef } from "react";
import { Loader, Text, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { FlexCenter, FlexCenterProps } from "./FlexCenter";

export type LoadingProps = FlexCenterProps;

export const Loading = forwardRef<HTMLDivElement, LoadingProps>((props, ref) => {
  const t = useMantineTheme();
  return (
    <FlexCenter {...props} ref={ref}>
      <Loader variant="bars" />
      <Text
        css={css`
          margin: 0 ${t.spacing.md}px;
          max-width: ${t.fontSizes.md * 25}px;
          overflow-x: auto;
        `}
      >
        {props.children ?? "Loading..."}
      </Text>
    </FlexCenter>
  );
});
