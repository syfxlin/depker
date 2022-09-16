import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";

export const Main: React.FC<PropsWithChildren> = ({ children }) => {
  const { u } = useU();
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        margin-left: ${u.s(20)};
        min-height: 100vh;
      `}
    >
      {children}
    </div>
  );
};
