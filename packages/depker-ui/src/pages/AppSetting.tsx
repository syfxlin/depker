import React from "react";
import { Main } from "../components/layout/Main";
import { Outlet, useParams } from "react-router-dom";
import { Badge, Button, Grid, Group, Stack, useMantineTheme } from "@mantine/core";
import { TbDeviceFloppy, TbInfoCircle, TbPlayerPlay } from "react-icons/all";
import { NavLink } from "../components/core/NavLink";
import { colors, useStatus } from "../api/use-status";

export const AppSetting: React.FC = () => {
  const t = useMantineTheme();
  const { name: app } = useParams<"name">();
  const status = useStatus([app!]);

  return (
    <Main
      title="App Settings"
      header={
        <Group>
          <Badge size="lg" color={colors[status.get(app!) ?? "stopped"]}>
            {status.get(app!) ?? "stopped"}
          </Badge>
          <Button variant="light" leftIcon={<TbPlayerPlay />}>
            Deploy
          </Button>
          <Button leftIcon={<TbDeviceFloppy />}>Save</Button>
        </Group>
      }
    >
      <Grid>
        <Grid.Col span={12} md={3}>
          <Stack spacing="xs">
            <NavLink label="General" icon={<TbInfoCircle />} action={[`/apps/${app}`, true]} />
            <NavLink label="Deploys" icon={<TbInfoCircle />} action={`/apps/${app}/deploys`} />
          </Stack>
        </Grid.Col>
        <Grid.Col span={12} md={9}>
          <Outlet />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
