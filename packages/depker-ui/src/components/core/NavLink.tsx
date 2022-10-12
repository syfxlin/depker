import React, { forwardRef } from "react";
import { NavLink as MLink, NavLinkProps as MLinkProps, useMantineTheme } from "@mantine/core";
import { NavLink as RLink } from "react-router-dom";
import { css } from "@emotion/react";

export type NavLinkProps = MLinkProps & {
  action: string | (() => void) | [string, boolean];
};

export const NavLink = forwardRef<any, NavLinkProps>(({ action, ...props }, ref) => {
  const t = useMantineTheme();
  if (typeof action === "function") {
    return (
      <MLink
        variant="light"
        component="button"
        onClick={() => action()}
        {...props}
        ref={ref}
        css={css`
          .mantine-NavLink-root {
            border-radius: ${t.radius.sm}px;
          }
        `}
      />
    );
  }
  if (typeof action === "string" && /(^https?:|^#)/.test(action)) {
    return (
      <MLink
        variant="light"
        component="a"
        href={action}
        {...props}
        ref={ref}
        css={css`
          .mantine-NavLink-root {
            border-radius: ${t.radius.sm}px;
          }
        `}
      />
    );
  }
  return (
    <RLink
      to={typeof action === "string" ? action : action[0]}
      end={typeof action === "string" ? false : action[1]}
      css={css`
        text-decoration: none;
        .mantine-NavLink-root {
          border-radius: ${t.radius.sm}px;
        }
      `}
    >
      {({ isActive }) => <MLink active={isActive} variant="light" component="span" {...props} ref={ref} />}
    </RLink>
  );
});
