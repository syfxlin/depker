import React, { ChangeEvent, forwardRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../api/use-app";
import { useBuildpacks } from "../api/use-buildpacks";
import { Avatar, Grid, Group, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import {
  TbActivity,
  TbAdjustments,
  TbApiApp,
  TbApps,
  TbAtom2,
  TbCertificate,
  TbCircleDot,
  TbClock,
  TbComet,
  TbDotsCircleHorizontal,
  TbDownload,
  TbEqual,
  TbFolder,
  TbForbid,
  TbInfinity,
  TbLink,
  TbList,
  TbPinnedOff,
  TbRefreshAlert,
  TbSeparator,
  TbSignature,
  TbSpace,
  TbTerminal,
  TbUser,
} from "react-icons/all";
import { ArrayInput } from "../components/input/ArrayInput";
import { ObjectArrayInput } from "../components/input/ObjectArrayInput";
import { ObjectInput } from "../components/input/ObjectInput";
import { RecordInput } from "../components/input/RecordInput";
import { RecordOnbuildInput } from "../components/input/RecordOnbuildInput";
import { Async } from "../components/core/Async";

export const AppGeneralTab: React.FC = () => {
  const { name: app } = useParams<"name">();
  const query = useApp(app!);
  const buildpacks = useBuildpacks();

  const Name = useMemo(
    () =>
      query.data && (
        <TextInput
          required
          label="Name"
          description="Application name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
          placeholder="Application Name"
          icon={<TbApps />}
          value={query.data.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            query.set((prev) => ({ ...prev, name: e.target.value }));
          }}
        />
      ),
    [query.data?.name, query.set]
  );

  const Buildpacks = useMemo(
    () =>
      query.data && (
        <Select
          required
          searchable
          label="Buildpack"
          description="Building application with build package."
          placeholder="Build Package"
          nothingFound="No packages"
          icon={<Avatar size="xs" src={`http://localhost:3000${query.data.buildpack.icon}`} />}
          value={query.data.buildpack.name}
          onChange={(value: string) => {
            const buildpack = buildpacks.get(value);
            if (!buildpack) {
              return;
            }
            query.set((prev) => ({
              ...prev,
              buildpack: {
                name: buildpack.name,
                label: buildpack.label,
                group: buildpack.group,
                icon: buildpack.icon,
                options: buildpack.options,
                values: prev.buildpack.values,
              },
            }));
          }}
          data={Array.from(buildpacks.values()).map((i) => ({
            value: i.name,
            label: i.label,
            group: i.group,
            icon: `http://localhost:3000${i.icon}`,
          }))}
          itemComponent={forwardRef<HTMLDivElement, any>(({ label, icon, ...props }, ref) => {
            return (
              <Group noWrap ref={ref} {...props}>
                <Avatar size="xs" src={icon}>
                  <TbApiApp />
                </Avatar>
                <Text size="sm">{label}</Text>
              </Group>
            );
          })}
        />
      ),
    [query.data?.buildpack, query.set, buildpacks]
  );

  const Commands = useMemo(
    () =>
      query.data && (
        <ArrayInput
          label="Commands"
          description="Replace the application container start commands."
          placeholder="Commands Item"
          icon={<TbTerminal />}
          value={query.data.commands}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, commands: value }));
          }}
        />
      ),
    [query.data?.commands, query.set]
  );

  const EntryPoints = useMemo(
    () =>
      query.data && (
        <ArrayInput
          label="Entry Points"
          description="Replace the application container entry points."
          placeholder="Entry Points Item"
          icon={<TbTerminal />}
          value={query.data.entrypoints}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, entrypoints: value }));
          }}
        />
      ),
    [query.data?.entrypoints, query.set]
  );

  const RestartPolicy = useMemo(
    () =>
      query.data && (
        <Select
          label="Restart Policy"
          description="Restart policy to apply when a container exits."
          placeholder="Restart Policy"
          icon={<TbRefreshAlert />}
          value={query.data.restart}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, restart: value as any }));
          }}
          data={[
            { label: "No", value: "no" },
            { label: "Always", value: "always" },
            { label: "On-Failure", value: "on-failure" },
          ]}
        />
      ),
    [query.data?.restart, query.set]
  );

  const PullImage = useMemo(
    () =>
      query.data && (
        <Select
          label="Pull Image"
          description="Pull image before running."
          placeholder="Pull Image"
          icon={<TbDownload />}
          value={query.data.pull ? "true" : "false"}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, pull: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [query.data?.pull, query.set]
  );

  const Domains = useMemo(
    () =>
      query.data && (
        <ArrayInput
          label="Domains"
          description="Domain name used to access the application."
          placeholder="Domains Item"
          icon={<TbLink />}
          value={query.data.domain}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, domain: value }));
          }}
        />
      ),
    [query.data?.domain, query.set]
  );

  const EnableTLS = useMemo(
    () =>
      query.data && (
        <Select
          label="Enable TLS"
          description="Whether to enable tls support."
          placeholder="Enable TLS"
          icon={<TbCertificate />}
          value={query.data.tls ? "true" : "false"}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, tls: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [query.data?.tls, query.set]
  );

  const ProxyPort = useMemo(
    () =>
      query.data && (
        <NumberInput
          label="Proxy Port"
          description="Traefik reverse proxy access to the container port."
          placeholder="Proxy Port"
          icon={<TbCircleDot />}
          min={1}
          max={65535}
          value={query.data.port}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, port: value ?? 3000 }));
          }}
        />
      ),
    [query.data?.port, query.set]
  );

  const ProxyScheme = useMemo(
    () =>
      query.data && (
        <TextInput
          label="Proxy Scheme"
          description="Protocol used by Traefik Reverse Proxy to access containers."
          placeholder="Proxy Scheme"
          icon={<TbAtom2 />}
          value={query.data.scheme}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            query.set((prev) => ({ ...prev, scheme: e.target.value }));
          }}
        />
      ),
    [query.data?.scheme, query.set]
  );

  const ProxyRule = useMemo(
    () =>
      query.data && (
        <TextInput
          label="Proxy Rule"
          description="Traefik reverse proxy rules, mutually exclusive with domains."
          placeholder="Proxy Rule"
          icon={<TbAtom2 />}
          value={query.data.rule}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            query.set((prev) => ({ ...prev, rule: e.target.value }));
          }}
        />
      ),
    [query.data?.rule, query.set]
  );

  const Middlewares = useMemo(
    () =>
      query.data && (
        <ObjectArrayInput
          label="Middlewares"
          description="Traefik middleware, for purposes such as authorization or flow restriction."
          placeholder="Middlewares Item"
          icon={<TbForbid />}
          value={query.data.middlewares}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, middlewares: value as any }));
          }}
        >
          {(item, setItem) => [
            <TextInput
              key="name"
              required
              label="Name"
              description="Traefik middleware name."
              placeholder="Middleware Name"
              icon={<TbSignature />}
              value={item.name ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
            />,
            <TextInput
              key="type"
              required
              label="Type"
              description="Traefik middleware type."
              placeholder="Middleware Type"
              icon={<TbAdjustments />}
              value={item.type ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, type: e.target.value })}
            />,
            <ArrayInput
              key="options"
              label="Options"
              description="Traefik middleware options."
              placeholder="Middleware Options"
              icon={<TbDotsCircleHorizontal />}
              value={item.options ?? []}
              onChange={(value) => setItem({ ...item, options: value })}
            />,
          ]}
        </ObjectArrayInput>
      ),
    [query.data?.middlewares, query.set]
  );

  const HealthCheck = useMemo(
    () =>
      query.data && (
        <ObjectInput
          label="Health Check"
          description="Container Health Check Configurations."
          placeholder="Health Check"
          icon={<TbActivity />}
          value={query.data.healthcheck}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, healthcheck: value as any }));
          }}
        >
          {(item, setItem) => [
            <ArrayInput
              key="commands"
              label="Commands"
              description="Command to run to check health."
              placeholder="Health Check Commands"
              icon={<TbTerminal />}
              value={item.cmd ?? []}
              onChange={(value) => setItem({ ...item, cmd: value })}
            />,
            <NumberInput
              key="retries"
              label="Retries"
              description="Consecutive failures needed to report unhealthy."
              placeholder="Health Check Retries"
              icon={<TbRefreshAlert />}
              value={item.retries ?? []}
              onChange={(value) => setItem({ ...item, retries: value })}
            />,
            <NumberInput
              key="interval"
              label="Interval (s)"
              description="Time between running the check."
              placeholder="Health Check Interval"
              icon={<TbSpace />}
              value={item.interval ?? []}
              onChange={(value) => setItem({ ...item, interval: value })}
            />,
            <NumberInput
              key="start"
              label="Start (s)"
              description="Start period for the container to initialize before starting."
              placeholder="Health Check Start Period"
              icon={<TbSeparator />}
              value={item.start ?? []}
              onChange={(value) => setItem({ ...item, start: value })}
            />,
            <NumberInput
              key="timeout"
              label="Timeout (s)"
              description="Maximum time to allow one check to run."
              placeholder="Health Check Timeout"
              icon={<TbClock />}
              value={item.timeout ?? []}
              onChange={(value) => setItem({ ...item, timeout: value })}
            />,
          ]}
        </ObjectInput>
      ),
    [query.data?.healthcheck, query.set]
  );

  const Init = useMemo(
    () =>
      query.data && (
        <Select
          label="Run an Init"
          description="Run an init inside the container that forwards signals."
          placeholder="Run an Init"
          icon={<TbInfinity />}
          value={query.data.init ? "true" : "false"}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, init: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [query.data?.init, query.set]
  );

  const Remove = useMemo(
    () =>
      query.data && (
        <Select
          label="Automatically Remove"
          description="Automatically remove the container when it exits."
          placeholder="Automatically Remove"
          icon={<TbPinnedOff />}
          value={query.data.rm ? "true" : "false"}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, rm: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [query.data?.rm, query.set]
  );

  const Privileged = useMemo(
    () =>
      query.data && (
        <Select
          label="Give privileges"
          description="Give extended privileges to this container."
          placeholder="Give privileges"
          icon={<TbComet />}
          value={query.data.privileged ? "true" : "false"}
          onChange={(value) => {
            query.set((prev) => ({ ...prev, privileged: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [query.data?.privileged, query.set]
  );

  const User = useMemo(
    () =>
      query.data && (
        <TextInput
          label="Username or UID"
          description="Username or UID (format: <name|uid>[:<group|gid>])."
          placeholder="Username or UID"
          icon={<TbUser />}
          value={query.data.user}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            query.set((prev) => ({ ...prev, user: e.target.value }));
          }}
        />
      ),
    [query.data?.user, query.set]
  );

  const Workdir = useMemo(
    () =>
      query.data && (
        <TextInput
          label="Working Directory"
          description="Working directory inside the container."
          placeholder="Working Directory"
          icon={<TbFolder />}
          value={query.data.workdir}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            query.set((prev) => ({ ...prev, workdir: e.target.value }));
          }}
        />
      ),
    [query.data?.workdir, query.set]
  );

  const BuildArgs = useMemo(
    () =>
      query.data && (
        <RecordInput
          label="Build Args"
          description="Set build-time variables."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Build Args Item Name"
          rightPlaceholder="Build Args Item Value"
          value={Object.entries(query.data.buildArgs)}
          onChange={(value) => {
            query.set((prev) => ({
              ...prev,
              buildArgs: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [query.data?.buildArgs, query.set]
  );

  const Networks = useMemo(
    () =>
      query.data && (
        <RecordInput
          label="Networks"
          description="Connect a container to a network."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Networks Item Name"
          rightPlaceholder="Networks Item Alias"
          value={Object.entries(query.data.networks)}
          onChange={(value) => {
            query.set((prev) => ({
              ...prev,
              networks: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [query.data?.networks, query.set]
  );

  const Labels = useMemo(
    () =>
      query.data && (
        <RecordOnbuildInput
          label="Labels"
          description="Set metadata on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Labels Item Name"
          rightPlaceholder="Labels Item Value"
          value={query.data.labels.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            query.set((prev) => ({
              ...prev,
              labels: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [query.data?.labels, query.set]
  );

  const Secrets = useMemo(
    () =>
      query.data && (
        <RecordOnbuildInput
          label="Secrets"
          description="Set secret on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Secrets Item Name"
          rightPlaceholder="Secrets Item Alias"
          value={query.data.secrets.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            query.set((prev) => ({
              ...prev,
              secrets: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [query.data?.secrets, query.set]
  );

  const Hosts = useMemo(
    () =>
      query.data && (
        <RecordOnbuildInput
          label="Hosts"
          description="Add a custom host-to-IP mapping."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Hosts Item Host"
          rightPlaceholder="Hosts Item IP"
          value={query.data.hosts.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            query.set((prev) => ({
              ...prev,
              hosts: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [query.data?.hosts, query.set]
  );

  const BasicRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {Name}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {Buildpacks}
        </Grid.Col>
      </Grid>
    ),
    [Name, Buildpacks]
  );

  const CommandsRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {Commands}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {EntryPoints}
        </Grid.Col>
      </Grid>
    ),
    [Commands, EntryPoints]
  );

  const PolicyRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {RestartPolicy}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {PullImage}
        </Grid.Col>
      </Grid>
    ),
    [RestartPolicy, PullImage]
  );

  const DomainRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {Domains}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {EnableTLS}
        </Grid.Col>
      </Grid>
    ),
    [Domains, EnableTLS]
  );

  const ProxyRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={4}>
          {ProxyPort}
        </Grid.Col>
        <Grid.Col span={12} md={4}>
          {ProxyScheme}
        </Grid.Col>
        <Grid.Col span={12} md={4}>
          {ProxyRule}
        </Grid.Col>
      </Grid>
    ),
    [ProxyPort, ProxyScheme, ProxyRule]
  );

  const ModeRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={4}>
          {Init}
        </Grid.Col>
        <Grid.Col span={12} md={4}>
          {Remove}
        </Grid.Col>
        <Grid.Col span={12} md={4}>
          {Privileged}
        </Grid.Col>
      </Grid>
    ),
    [Init, Remove, Privileged]
  );

  const WorkingRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {User}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {Workdir}
        </Grid.Col>
      </Grid>
    ),
    [User, Workdir]
  );

  return (
    <Async query={query}>
      <Stack>
        {BasicRow}
        {CommandsRow}
        {PolicyRow}
        {DomainRow}
        {ProxyRow}
        {Middlewares}
        {HealthCheck}
        {ModeRow}
        {WorkingRow}
        {BuildArgs}
        {Networks}
        {Labels}
        {Secrets}
        {Hosts}
      </Stack>
    </Async>
  );
};
