import React, { PropsWithChildren } from "react";
import { Center, Navbar, Stack } from "@mantine/core";
import { NavLink } from "./NavLink";
import { IconBrightness, IconLogout, IconSettings } from "@tabler/icons";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { showNotification } from "@mantine/notifications";
import { AxiosError } from "axios";
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
        <Stack justify="center" spacing={0}>
          {children}
        </Stack>
      </Navbar.Section>
      <Navbar.Section>
        <Stack justify="center" spacing={0}>
          <NavLink
            icon={IconBrightness}
            label={`当前模式：${mode}`}
            action={() => {
              setMode((p) => {
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
          <NavLink icon={IconSettings} label="设置" action="/settings" />
          <NavLink
            icon={IconLogout}
            label="登出"
            action={() => {
              logout()
                .then(() =>
                  showNotification({
                    title: "登出成功",
                    message: "正在跳转。。。",
                    color: "green",
                  })
                )
                .catch((e: AxiosError) =>
                  showNotification({
                    title: "登出失败",
                    message: e.message,
                  })
                );
            }}
          />
        </Stack>
      </Navbar.Section>
    </Navbar>
  );
};
