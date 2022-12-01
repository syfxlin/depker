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
import { useService } from "../api/use-service";
import { css } from "@emotion/react";
import { NavLink } from "../components/core/NavLink";
import { useCalling } from "../hooks/use-calling";

export type ServiceSettingContext = {
  name: string;
  service: ReturnType<typeof useService>;
  status: ReturnType<typeof useStatus>;
};

export const ServiceSetting: React.FC = () => {
  const navigate = useNavigate();
  const { service: name } = useParams<"service">();
  const service = useService(name!);
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
                await service.actions.stop();
                actions.success(`Stop successful`, `Service stop successful.`);
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
                await service.actions.restart();
                actions.success(`Restart successful`, `Service restart successful.`);
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
              const deploy = await service.actions.deploy();
              actions.success(`Deploy successful`, `Service create deploy #${deploy.id} successful.`);
              navigate(`/services/${name}/deploys/${deploy.id}`);
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
              await service.actions.save();
              actions.success(`Save successful`, `Service save successful.`);
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

  const ServiceNav = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <Stack spacing="xs">
          <NavLink label="Configs" icon={<TbInfoCircle />} action={`/services/${name}/`} />
          <NavLink label="Deploys" icon={<TbWreckingBall />} action={`/services/${name}/deploys`} />
          <NavLink label="Metrics" icon={<TbActivity />} action={`/services/${name}/metrics`} />
          <NavLink label="Logs" icon={<TbNotes />} action={`/services/${name}/logs`} />
          <NavLink label="Terminal" icon={<TbTerminal />} action={`/services/${name}/terminal`} />
          <NavLink label="History" icon={<TbHistory />} action={`/services/${name}/history`} />
          <NavLink label="Danger Zone" icon={<TbAlertTriangle />} color="red" action={`/services/${name}/danger`} />
        </Stack>
      </Grid.Col>
    ),
    [name]
  );

  return (
    <Main
      title="Service Settings"
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
        {ServiceNav}
        <Grid.Col span={12} md={9}>
          <Outlet context={{ name, service, status }} />
        </Grid.Col>
      </Grid>
    </Main>
  );
};
