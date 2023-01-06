import React, { useMemo } from "react";
import { Main } from "../components/layout/Main";
import { Grid, Stack } from "@mantine/core";
import { NavLink } from "../components/core/NavLink";
import { TbNetwork, TbOutlet, TbPackgeImport, TbSettings, TbTerminal2 } from "react-icons/all";
import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";

export const Settings: React.FC = () => {
  const SettingNav = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <Stack spacing="xs">
          <NavLink label="General" icon={<TbSettings />} action={`/settings/`} />
          <NavLink label="Images" icon={<TbPackgeImport />} action={`/settings/images`} />
          <NavLink label="Networks" icon={<TbNetwork />} action={`/settings/networks`} />
          <NavLink label="Plugins" icon={<TbOutlet />} action={`/settings/plugins`} />
          <NavLink label="Node Shell" icon={<TbTerminal2 />} action={`/settings/shell`} />
        </Stack>
      </Grid.Col>
    ),
    []
  );

  return (
    <Main title="Settings">
      <Grid
        css={css`
          flex: 1;
        `}
      >
        {SettingNav}
        <Grid.Col span={12} md={9}>
          <Outlet />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
