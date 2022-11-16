import React from "react";
import { Center, Navbar, Stack, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { showNotification } from "@mantine/notifications";
import { logout } from "../../api/client";
import {
  TbApps,
  TbBrightness,
  TbCircleDot,
  TbCode,
  TbFiles,
  TbFolders,
  TbHome2,
  TbLogout,
  TbSettings,
} from "react-icons/all";
import { SidebarLink } from "../core/SidebarLink";

export const Sidebar: React.FC = () => {
  const t = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <Navbar
      css={css`
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 80px;
        padding: ${t.spacing.md}px;
      `}
    >
      <Center>{/*<MantineLogo type="mark" size={30} />*/}</Center>
      <Navbar.Section grow mt={50}>
        <Stack justify="center" spacing="xs">
          <SidebarLink icon={TbHome2} label="Home" action="/home" />
          <SidebarLink icon={TbApps} label="Apps" action="/apps" />
          <SidebarLink icon={TbCode} label="Tokens" action="/tokens" />
          <SidebarLink icon={TbCircleDot} label="Ports" action="/ports" />
          <SidebarLink icon={TbFolders} label="Volumes" action="/volumes" />
          <SidebarLink icon={TbFiles} label="Files" action="/files" />
        </Stack>
      </Navbar.Section>
      <Navbar.Section>
        <Stack justify="center" spacing="xs">
          <SidebarLink icon={TbBrightness} label={`Color Mode：${colorScheme}`} action={() => toggleColorScheme()} />
          <SidebarLink icon={TbSettings} label="Settings" action="/settings" />
          <SidebarLink
            icon={TbLogout}
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
