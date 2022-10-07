import React, { PropsWithChildren } from "react";
import { Center, Navbar, Stack } from "@mantine/core";
import { NavLink } from "./NavLink";
import { IconBrightness, IconLogout, IconSettings } from "@tabler/icons";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { showNotification } from "@mantine/notifications";
import { logout } from "../api/client";

export const Nav: React.FC<PropsWithChildren> = ({ children }) => {
  const { u, mode, setMode } = useU();
  return (
    <Navbar
      css={css`
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: ${u.s(20)};
        padding: ${u.sp(4)};
      `}
    >
      <Center>{/*<MantineLogo type="mark" size={30} />*/}</Center>
      <Navbar.Section grow mt={50}>
        <Stack justify="center" spacing={u.sp(1)}>
          {children}
        </Stack>
      </Navbar.Section>
      <Navbar.Section>
        <Stack justify="center" spacing={u.sp(1)}>
          <NavLink
            icon={IconBrightness}
            label={`Color Mode：${mode}`}
            action={() => {
              setMode((p: string) => {
                if (p === "auto") {
                  return "light";
                }
                if (p === "light") {
                  return "dark";
                }
                if (p === "dark") {
                  return "auto";
                }
                return "auto";
              });
            }}
          />
          <NavLink icon={IconSettings} label="Settings" action="/settings" />
          <NavLink
            icon={IconLogout}
            label="Logout"
            action={() => {
              logout();
              showNotification({
                title: "Logout successful",
                message: "Redirecting...",
                color: "green",
              });
            }}
          />
        </Stack>
      </Navbar.Section>
    </Navbar>
  );
};
