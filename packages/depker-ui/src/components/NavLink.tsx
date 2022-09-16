import React from "react";
import { TablerIcon } from "@tabler/icons";
import { Tooltip, UnstyledButton } from "@mantine/core";
import { NavLink as Link } from "react-router-dom";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";

export interface NavLinkProps {
  icon: TablerIcon;
  label: string;
  action: string | (() => void);
}

export const NavLink: React.FC<NavLinkProps> = ({ icon: Icon, label, action }) => {
  const { u } = useU();
  const props: Record<string, any> = {};
  if (typeof action === "function") {
    props.component = "button";
    props.onClick = () => action();
  } else if (/(^https?:|^#)/.test(action)) {
    props.component = "a";
    props.href = action;
  } else {
    props.component = Link;
    props.to = action;
  }
  return (
    <Tooltip label={label} position="right" withArrow={true} transition="pop" transitionDuration={300} zIndex={998}>
      <UnstyledButton
        {...props}
        css={css`
          width: ${u.s(12)};
          height: ${u.s(12)};
          border-radius: ${u.br(2)};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${u.c("gray7", "dark0")};

          &:hover {
            background-color: ${u.c("gray0", "dark5")};
          }

          &.active,
          &.active:hover {
            color: ${u.c("primary7", "primary3")};
            background-color: ${u.c("primary1,5", "primary9,5")};
          }
        `}
      >
        <Icon stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
};
