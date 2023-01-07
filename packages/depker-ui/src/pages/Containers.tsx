import React, { useMemo } from "react";
import { Main } from "../components/layout/Main";
import { Grid, Stack } from "@mantine/core";
import { NavLink } from "../components/core/NavLink";
import { TbArrowBack, TbNetwork, TbOutlet, TbTerminal2 } from "react-icons/all";
import { css } from "@emotion/react";
import { Outlet, useParams } from "react-router-dom";

export const Containers: React.FC = () => {
  const { container } = useParams<"container">();
  const Nav = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <Stack spacing="xs">
          <NavLink label="Back Containers" icon={<TbArrowBack />} action={`/settings/containers`} />
          <NavLink label="Metrics" icon={<TbNetwork />} action={`/containers/${container}/metrics`} />
          <NavLink label="Logs" icon={<TbOutlet />} action={`/containers/${container}/logs`} />
          <NavLink label="Terminal" icon={<TbTerminal2 />} action={`/containers/${container}/terminal`} />
        </Stack>
      </Grid.Col>
    ),
    [container]
  );
  return (
    <Main title="Containers">
      <Grid
        css={css`
          flex: 1;
        `}
      >
        {Nav}
        <Grid.Col span={12} md={9}>
          <Outlet />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
