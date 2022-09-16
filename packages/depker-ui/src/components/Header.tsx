import React from "react";
import { Title } from "@mantine/core";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";

export const Header: React.FC = () => {
  const { u } = useU();
  return (
    <header
      css={css`
        padding: ${u.sp(6)} ${u.sp(8)} ${u.sp(3)};
        display: flex;
        flex-direction: row;
        align-items: center;
      `}
    >
      <Title
        order={2}
        css={css`
          line-height: 1;
          vertical-align: middle;
        `}
      >
        主页
      </Title>
    </header>
  );
};
