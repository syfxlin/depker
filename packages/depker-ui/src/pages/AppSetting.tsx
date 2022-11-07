import React, { useMemo } from "react";
import { Main } from "../components/layout/Main";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Grid, Group, Loader, Stack } from "@mantine/core";
import {
  TbActivity,
  TbAlertTriangle,
  TbDeviceFloppy,
  TbHistory,
  TbInfoCircle,
  TbNotes,
  TbPlayerPause,
  TbPlayerPlay,
  TbPlayerStop,
  TbRefresh,
  TbTerminal,
  TbWreckingBall,
} from "react-icons/all";
import { colors, useStatus } from "../api/use-status";
import { useApp } from "../api/use-app";
import { showNotification } from "@mantine/notifications";
import { error } from "../utils/message";
import { useLoading } from "../hooks/use-loading";
import { css } from "@emotion/react";
import { NavLink } from "../components/core/NavLink";

export type AppSettingContext = {
  name: string;
  app: ReturnType<typeof useApp>;
  status: ReturnType<typeof useStatus>;
};

export const AppSetting: React.FC = () => {
  const navigate = useNavigate();
  const { app: name } = useParams<"app">();
  const app = useApp(name!);
  const status = useStatus(name!);
  const running = useLoading();

  const Status = useMemo(
    () => (
      <Badge
        size="lg"
        color={colors[status.data]}
        leftSection={status.loading && <Loader size="xs" color={colors[status.data]} />}
        css={css`
          .mantine-Badge-leftSection {
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `}
      >
        {status.data}
      </Badge>
    ),
    [status.data, status.loading]
  );

  const Stop = useMemo(
    () =>
      ["running", "restarting", "exited"].includes(status.data) && (
        <Button
          loading={running.value}
          variant="light"
          color="red"
          leftIcon={<TbPlayerPause />}
          onClick={() => {
            (async () => {
              try {
                running.update(true);
                await app.actions.stop();
                running.update(false);
                showNotification({
                  title: "Stop successful",
                  message: `Application stop successful.`,
                  color: "green",
                });
              } catch (e: any) {
                showNotification({
                  title: "Stop failure",
                  message: error(e),
                });
              }
            })();
          }}
        >
          Stop
        </Button>
      ),
    [status.data, running.value]
  );

  const Restart = useMemo(
    () =>
      ["running", "restarting", "exited"].includes(status.data) && (
        <Button
          loading={running.value}
          variant="light"
          leftIcon={<TbRefresh />}
          onClick={() => {
            (async () => {
              try {
                running.update(true);
                await app.actions.restart();
                running.update(false);
                showNotification({
                  title: "Restart successful",
                  message: `Application restart successful.`,
                  color: "green",
                });
              } catch (e: any) {
                showNotification({
                  title: "Restart failure",
                  message: error(e),
                });
              }
            })();
          }}
        >
          Restart
        </Button>
      ),
    [status.data, running.value]
  );

  const Deploy = useMemo(
    () => (
      <Button
        loading={running.value}
        variant="light"
        leftIcon={status.data !== "stopped" ? <TbPlayerStop /> : <TbPlayerPlay />}
        onClick={() => {
          (async () => {
            try {
              running.update(true);
              const deploy = await app.actions.deploy(status.data !== "stopped");
              running.update(false);
              showNotification({
                title: "Deploy successful",
                message: `Application create deploy #${deploy.id} successful.`,
                color: "green",
              });
              navigate(`/apps/depker/deploys/${deploy.id}`);
            } catch (e: any) {
              showNotification({
                title: "Deploy failure",
                message: error(e),
              });
            }
          })();
        }}
      >
        {status.data !== "stopped" ? "Re-deploy" : "Deploy"}
      </Button>
    ),
    [status.data, running.value]
  );

  const Save = useMemo(
    () => (
      <Button
        loading={running.value}
        leftIcon={<TbDeviceFloppy />}
        onClick={() => {
          (async () => {
            try {
              running.update(true);
              await app.actions.save();
              running.update(false);
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
          })();
        }}
      >
        Save
      </Button>
    ),
    [running.value]
  );

  const AppNav = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <Stack spacing="xs">
          <NavLink label="Configs" icon={<TbInfoCircle />} action={`/apps/${name}/`} />
          <NavLink label="Deploys" icon={<TbWreckingBall />} action={`/apps/${name}/deploys`} />
          <NavLink label="Metrics" icon={<TbActivity />} action={`/apps/${name}/metrics`} />
          <NavLink label="Logs" icon={<TbNotes />} action={`/apps/${name}/logs`} />
          <NavLink label="Terminal" icon={<TbTerminal />} action={`/apps/${name}/terminal`} />
          <NavLink label="History" icon={<TbHistory />} action={`/apps/${name}/history`} />
          <NavLink label="Danger Zone" icon={<TbAlertTriangle />} color="red" action={`/apps/${name}/danger`} />
        </Stack>
      </Grid.Col>
    ),
    [name]
  );

  return (
    <Main
      title="App Settings"
      header={
        <Group spacing="xs">
          {Status}
          {Stop}
          {Restart}
          {Deploy}
          {Save}
        </Group>
      }
    >
      <Grid
        css={css`
          flex: 1;
        `}
      >
        {AppNav}
        <Grid.Col span={12} md={9}>
          <Outlet context={{ name, app, status }} />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
