import React, { forwardRef } from "react";
import { Alert, AlertProps, Center, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { TbCircle } from "react-icons/all";

export type EmptyProps = Partial<AlertProps>;

export const Empty = forwardRef<HTMLDivElement, EmptyProps>((props, ref) => {
  const t = useMantineTheme();
  return (
    <Center ref={ref}>
      <Alert
        icon={<TbCircle />}
        color="gray"
        title="No Items"
        {...props}
        css={css`
          margin: 0 ${t.spacing.md}px;
          max-width: ${t.fontSizes.md * 25}px;
        `}
      >
        The list is empty.
        {props.children}
      </Alert>
    </Center>
  );
});
