import { Text, TextProps, useMantineTheme } from "@mantine/core";
import React, { forwardRef } from "react";
import { css } from "@emotion/react";

export type HeadingProps = TextProps;

export const Heading = forwardRef<HTMLDivElement, HeadingProps>((props, ref) => {
  const t = useMantineTheme();
  return (
    <Text
      {...props}
      ref={ref}
      css={css`
        padding-bottom: ${t.spacing.xs * 0.5}px;
        border-bottom: 1px solid ${t.colorScheme === "light" ? t.colors.gray[3] : t.colors.dark[4]};
        font-size: ${t.headings.sizes.h4.fontSize}px;
        font-weight: 500;
      `}
    >
      {props.children}
    </Text>
  );
});
