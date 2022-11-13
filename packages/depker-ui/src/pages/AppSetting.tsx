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
import { css } from "@emotion/react";
import { NavLink } from "../components/core/NavLink";
import { useCalling } from "../hooks/use-calling";

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
  const calling = useCalling();

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
          loading={calling.loading}
          variant="light"
          color="red"
          leftIcon={<TbPlayerPause />}
          onClick={() => {
            calling.calling(async (actions) => {
              try {
                await app.actions.stop();
                actions.success(`Stop successful`, `Application stop successful.`);
              } catch (e: any) {
                actions.failure(`Stop failure`, e);
              }
            });
          }}
        >
          Stop
        </Button>
      ),
    [status.data, calling.loading]
  );

  const Restart = useMemo(
    () =>
      ["running", "restarting", "exited"].includes(status.data) && (
        <Button
          loading={calling.loading}
          variant="light"
          leftIcon={<TbRefresh />}
          onClick={() => {
            calling.calling(async (actions) => {
              try {
                await app.actions.restart();
                actions.success(`Restart successful`, `Application restart successful.`);
              } catch (e: any) {
                actions.failure(`Restart failure`, e);
              }
            });
          }}
        >
          Restart
        </Button>
      ),
    [status.data, calling.loading]
  );

  const Deploy = useMemo(
    () => (
      <Button
        loading={calling.loading}
        variant="light"
        leftIcon={status.data !== "stopped" ? <TbPlayerStop /> : <TbPlayerPlay />}
        onClick={() =>
          calling.calling(async (actions) => {
            try {
              const deploy = await app.actions.deploy();
              actions.success(`Deploy successful`, `Application create deploy #${deploy.id} successful.`);
              navigate(`/apps/${name}/deploys/${deploy.id}`);
            } catch (e: any) {
              actions.failure(`Deploy failure`, e);
            }
          })
        }
      >
        {status.data !== "stopped" ? "Re-deploy" : "Deploy"}
      </Button>
    ),
    [name, status.data, calling.loading]
  );

  const Save = useMemo(
    () => (
      <Button
        loading={calling.loading}
        leftIcon={<TbDeviceFloppy />}
        onClick={() => {
          calling.calling(async (actions) => {
            try {
              await app.actions.save();
              actions.success(`Save successful`, `Application save successful.`);
            } catch (e: any) {
              actions.failure(`Save failure`, e);
            }
          });
        }}
      >
        Save
      </Button>
    ),
    [calling.loading]
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
