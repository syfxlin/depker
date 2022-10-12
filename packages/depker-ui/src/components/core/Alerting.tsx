import React, { forwardRef } from "react";
import { css } from "@emotion/react";
import { Alert, useMantineTheme } from "@mantine/core";
import { TbAlertCircle } from "react-icons/all";
import { FlexCenter, FlexCenterProps } from "./FlexCenter";

export type AlertingProps = FlexCenterProps;

export const Alerting = forwardRef<HTMLDivElement, AlertingProps>((props, ref) => {
  const t = useMantineTheme();
  return (
    <FlexCenter {...props} ref={ref}>
      <Alert
        color="red"
        title="Error!"
        icon={<TbAlertCircle />}
        css={css`
          margin: 0 ${t.spacing.md}px;
          max-width: ${t.fontSizes.md * 25}px;
          overflow-x: auto;
        `}
      >
        {props.children ?? "Uncaught exception"}
      </Alert>
    </FlexCenter>
  );
});
