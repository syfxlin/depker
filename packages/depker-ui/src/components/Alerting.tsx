import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { Alert as MAlert, Center } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons";
import { useU } from "@syfxlin/ustyled";

export type AlertingProps = PropsWithChildren;

export const Alerting: React.FC<AlertingProps> = ({ children }) => {
  const { u } = useU();
  return (
    <Center
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
      `}
    >
      <MAlert
        color="red"
        title="Error!"
        icon={<IconAlertCircle />}
        css={css`
          margin: 0 ${u.sp(4)};
          max-width: 25rem;
          overflow-x: auto;
        `}
      >
        {children ?? "Uncaught exception"}
      </MAlert>
    </Center>
  );
};
