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
import { useLoading } from "../hooks/use-loading";
import { css } from "@emotion/react";

export type AppSettingContext = {
  name: string;
  app: ReturnType<typeof useApp>;
  status: ReturnType<typeof useStatus>;
};

export const AppSetting: React.FC = () => {
  const { app: name } = useParams<"app">();
  const app = useApp(name!);
  const status = useStatus(name!);
  const saving = useLoading();

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
            loading={saving.value}
            leftIcon={<TbDeviceFloppy />}
            onClick={async () => {
              try {
                saving.update(true);
                await app.actions.save();
                saving.update(false);
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
      <Grid
        css={css`
          flex: 1;
        `}
      >
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
