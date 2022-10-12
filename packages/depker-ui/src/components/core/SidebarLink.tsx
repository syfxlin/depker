import React, { forwardRef, ReactNode } from "react";
import { IconType } from "react-icons";
import { Tooltip, UnstyledButton, useMantineTheme } from "@mantine/core";
import { NavLink as Link } from "react-router-dom";
import { css } from "@emotion/react";

export interface SidebarProps {
  icon: IconType;
  label: ReactNode;
  action: string | (() => void);
}

export const SidebarLink = forwardRef<any, SidebarProps>(({ icon: Icon, label, action }, ref) => {
  const t = useMantineTheme();
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
    <Tooltip label={label} position="right" withArrow transition="pop" transitionDuration={300} zIndex={1998}>
      <UnstyledButton
        {...props}
        ref={ref}
        css={css`
          width: 48px;
          height: 48px;
          border-radius: ${t.radius.sm}px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${t.colorScheme === "light" ? t.colors.gray[7] : t.colors.dark[0]};

          &:hover {
            background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
          }

          &.active,
          &.active:hover {
            color: ${t.fn.primaryColor()};
            background-color: ${t.colorScheme === "light"
              ? t.fn.rgba(t.colors[t.primaryColor][1], 0.5)
              : t.fn.rgba(t.colors[t.primaryColor][9], 0.5)};
          }
        `}
      >
        <Icon size={t.fontSizes.xl} strokeWidth={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
});
