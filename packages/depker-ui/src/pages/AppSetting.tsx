import React from "react";
import { Main } from "../components/layout/Main";
import { Outlet, useParams } from "react-router-dom";
import { Badge, Button, Grid, Group, Stack } from "@mantine/core";
import {
  TbActivity,
  TbAlertTriangle,
  TbDeviceFloppy,
  TbFiles,
  TbHistory,
  TbInfoCircle,
  TbNotes,
  TbPlayerPlay,
  TbTerminal,
  TbWreckingBall,
} from "react-icons/all";
import { NavLink } from "../components/core/NavLink";
import { colors, useStatus } from "../api/use-status";
import { useApp } from "../api/use-app";
import { showNotification } from "@mantine/notifications";
import { error } from "../utils/message";

export type AppSettingContext = {
  name: string;
  app: ReturnType<typeof useApp>;
  status: ReturnType<typeof useStatus>;
};

export const AppSetting: React.FC = () => {
  const { name } = useParams<"name">();
  const app = useApp(name!);
  const status = useStatus(name!);

  return (
    <Main
      title="App Settings"
      header={
        <Group>
          <Badge size="lg" color={colors[status.data]}>
            {status.data}
          </Badge>
          <Button variant="light" leftIcon={<TbPlayerPlay />}>
            Deploy
          </Button>
          <Button
            leftIcon={<TbDeviceFloppy />}
            onClick={async () => {
              try {
                await app.save();
                showNotification({
                  title: "Save successful",
                  message: "Application save successful.",
                  color: "green",
                });
              } catch (e: any) {
                showNotification({
                  title: "Save failure",
                  message: error(e),
                });
              }
            }}
          >
            Save
          </Button>
        </Group>
      }
    >
      <Grid>
        <Grid.Col span={12} md={3}>
          <Stack spacing="xs">
            <NavLink label="Configs" icon={<TbInfoCircle />} action={`/apps/${name}/`} />
            <NavLink label="Deploys" icon={<TbWreckingBall />} action={`/apps/${name}/deploys`} />
            <NavLink label="Metrics" icon={<TbActivity />} action={`/apps/${name}/metrics`} />
            <NavLink label="Logs" icon={<TbNotes />} action={`/apps/${name}/logs`} />
            <NavLink label="History" icon={<TbHistory />} action={`/apps/${name}/history`} />
            <NavLink label="Files" icon={<TbFiles />} action={`/apps/${name}/files`} />
            <NavLink label="Terminal" icon={<TbTerminal />} action={`/apps/${name}/terminal`} />
            <NavLink label="Danger Zone" icon={<TbAlertTriangle />} color="red" action={`/apps/${name}/danger`} />
          </Stack>
        </Grid.Col>
        <Grid.Col span={12} md={9}>
          <Outlet context={{ name, app, status }} />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
