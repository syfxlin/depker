import React, { ChangeEvent, forwardRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useBuildpacks } from "../api/use-buildpacks";
import { Avatar, Grid, Group, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import {
  TbActivity,
  TbAdjustments,
  TbApiApp,
  TbApps,
  TbAtom2,
  TbBox,
  TbCertificate,
  TbCircleDot,
  TbClock,
  TbComet,
  TbDotsCircleHorizontal,
  TbDownload,
  TbEditCircle,
  TbEqual,
  TbFolder,
  TbForbid,
  TbInfinity,
  TbLink,
  TbList,
  TbMoon,
  TbPinnedOff,
  TbRefreshAlert,
  TbSeparator,
  TbSignature,
  TbSpace,
  TbTerminal,
  TbTimeline,
  TbUser,
} from "react-icons/all";
import { ArrayInput } from "../components/input/ArrayInput";
import { ObjectArrayInput } from "../components/input/ObjectArrayInput";
import { ObjectInput } from "../components/input/ObjectInput";
import { RecordInput } from "../components/input/RecordInput";
import { RecordOnbuildInput } from "../components/input/RecordOnbuildInput";
import { Async } from "../components/core/Async";
import { usePorts } from "../api/use-ports";
import { AutocompleteArrayInput } from "../components/input/AutocompleteArrayInput";
import { useVolumes } from "../api/use-volumes";
import { ServiceSettingContext } from "./ServiceSetting";
import { ExtensionInput } from "../components/input/ExtensionInput";
import { Heading } from "../components/parts/Heading";
import { client } from "../api/client";

export const ServiceConfigsTab: React.FC = () => {
  const { service } = useOutletContext<ServiceSettingContext>();
  const buildpacks = useBuildpacks();
  const ports = usePorts();
  const volumes = useVolumes();

  // general
  const Name = useMemo(
    () =>
      service.data && (
        <TextInput
          required
          label="Name"
          description="Service name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
          placeholder="Service Name"
          icon={<TbApps />}
          value={service.data.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, name: e.target.value }));
          }}
        />
      ),
    [service.data?.name]
  );

  const Type = useMemo(
    () =>
      service.data && (
        <Select
          key="type"
          required
          readOnly
          label="Type"
          description="Service type (readonly), App is a resident service, and Job is a scheduled or one-time service"
          placeholder="Type"
          icon={<TbMoon />}
          value={service.data.type}
          onChange={(value: string) => {
            service.actions.update((prev) => ({ ...prev, type: value as any }));
          }}
          data={[
            {
              value: "app",
              label: "App",
            },
            {
              value: "job",
              label: "Job",
            },
          ]}
        />
      ),
    [service.data?.type]
  );

  const Buildpacks = useMemo(
    () =>
      service.data && (
        <Select
          required
          searchable
          label="Buildpack"
          description="Building service with build package."
          placeholder="Build Package"
          nothingFound="No packages"
          icon={<Avatar size="xs" src={client.assets.icon(buildpacks.data[service.data.buildpack]?.icon)} />}
          value={service.data.buildpack}
          onChange={(value: string) => {
            const buildpack = buildpacks.data[value];
            if (!buildpack) {
              return;
            }
            service.actions.update((prev) => ({ ...prev, buildpack: value, extensions: {} }));
          }}
          data={Object.values(buildpacks.data).map((i) => ({
            value: i.name,
            label: i.label,
            group: i.group,
            icon: client.assets.icon(i.icon),
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
    [service.data?.buildpack, buildpacks.data]
  );

  const PullImage = useMemo(
    () =>
      service.data && (
        <Select
          label="Pull Image"
          description="Pull image before running."
          placeholder="Pull Image"
          icon={<TbDownload />}
          value={service.data.pull ? "true" : "false"}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, pull: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [service.data?.pull]
  );

  const RestartPolicy = useMemo(
    () =>
      service.data && (
        <Select
          label="Restart Policy"
          description="Restart policy to apply when a container exits."
          placeholder="Restart Policy"
          icon={<TbRefreshAlert />}
          value={service.data.restart}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, restart: value as any }));
          }}
          data={[
            { label: "No", value: "no" },
            { label: "Always", value: "always" },
            { label: "On-Failure", value: "on-failure" },
          ]}
        />
      ),
    [service.data?.restart]
  );

  const HealthCheck = useMemo(
    () =>
      service.data && (
        <ObjectInput
          label="Health Check"
          description="Container Health Check Configurations."
          placeholder="Health Check"
          icon={<TbActivity />}
          value={service.data.healthcheck}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, healthcheck: value as any }));
          }}
          modals={(item, setItem) => [
            <ArrayInput
              key="commands"
              label="Commands"
              description="Command to run to check health."
              placeholder="Health Check Commands"
              icon={<TbTerminal />}
              value={item.cmd}
              onChange={(value) => setItem({ ...item, cmd: value })}
            />,
            <NumberInput
              key="retries"
              label="Retries"
              description="Consecutive failures needed to report unhealthy."
              placeholder="Health Check Retries"
              icon={<TbRefreshAlert />}
              value={item.retries}
              onChange={(value) => setItem({ ...item, retries: value })}
            />,
            <NumberInput
              key="interval"
              label="Interval (s)"
              description="Time between running the check."
              placeholder="Health Check Interval"
              icon={<TbSpace />}
              value={item.interval}
              onChange={(value) => setItem({ ...item, interval: value })}
            />,
            <NumberInput
              key="start"
              label="Start (s)"
              description="Start period for the container to initialize before starting."
              placeholder="Health Check Start Period"
              icon={<TbSeparator />}
              value={item.start}
              onChange={(value) => setItem({ ...item, start: value })}
            />,
            <NumberInput
              key="timeout"
              label="Timeout (s)"
              description="Maximum time to allow one check to run."
              placeholder="Health Check Timeout"
              icon={<TbClock />}
              value={item.timeout}
              onChange={(value) => setItem({ ...item, timeout: value })}
            />,
          ]}
        />
      ),
    [service.data?.healthcheck]
  );

  const Cron = useMemo(
    () =>
      service.data?.type === "job" && (
        <TextInput
          required
          label="Cron"
          description="Cron expression, support to minute level. format: minute hour day month week."
          placeholder="Cron expression, minute hour day month week"
          icon={<TbTimeline />}
          value={service.data.extensions?.cron ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, extensions: { ...prev.extensions, cron: e.target.value } }));
          }}
        />
      ),
    [service.data?.type, service.data?.extensions?.cron]
  );

  const Image = useMemo(
    () =>
      service.data?.buildpack === "image" && (
        <TextInput
          required
          label="Image"
          description="An image name is made up of slash-separated name components."
          placeholder="Container Image"
          icon={<TbBox />}
          value={service.data.extensions?.image ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, extensions: { ...prev.extensions, image: e.target.value } }));
          }}
        />
      ),
    [service.data?.buildpack, service.data?.extensions?.image]
  );

  const GeneralRow = useMemo(
    () => (
      <Grid>
        <Grid.Col span={12} md={6}>
          {Name}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {Type}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {Buildpacks}
        </Grid.Col>
        {Cron && (
          <Grid.Col span={12} md={6}>
            {Cron}
          </Grid.Col>
        )}
        {Image && (
          <Grid.Col span={12} md={6}>
            {Image}
          </Grid.Col>
        )}
        <Grid.Col span={12} md={6}>
          {PullImage}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {RestartPolicy}
        </Grid.Col>
        <Grid.Col span={12} md={6}>
          {HealthCheck}
        </Grid.Col>
      </Grid>
    ),
    [Name, Type, Buildpacks, PullImage, RestartPolicy, HealthCheck, Cron, Image]
  );

  // requests
  const Domains = useMemo(
    () =>
      service.data && (
        <ArrayInput
          label="Domains"
          description="Domain name used to access the service."
          placeholder="Domains Item"
          icon={<TbLink />}
          value={service.data.domain}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, domain: value }));
          }}
        />
      ),
    [service.data?.domain]
  );

  const EnableTLS = useMemo(
    () =>
      service.data && (
        <Select
          label="Enable TLS"
          description="Whether to enable tls support."
          placeholder="Enable TLS"
          icon={<TbCertificate />}
          value={service.data.tls ? "true" : "false"}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, tls: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [service.data?.tls]
  );

  const ProxyPort = useMemo(
    () =>
      service.data && (
        <NumberInput
          label="Proxy Port"
          description="Traefik reverse proxy access to the container port."
          placeholder="Proxy Port"
          icon={<TbCircleDot />}
          min={1}
          max={65535}
          value={service.data.port}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, port: value ?? 80 }));
          }}
        />
      ),
    [service.data?.port]
  );

  const ProxyScheme = useMemo(
    () =>
      service.data && (
        <TextInput
          label="Proxy Scheme"
          description="Protocol used by Traefik Reverse Proxy to access containers."
          placeholder="Proxy Scheme"
          icon={<TbAtom2 />}
          value={service.data.scheme}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, scheme: e.target.value }));
          }}
        />
      ),
    [service.data?.scheme]
  );

  const ProxyRule = useMemo(
    () =>
      service.data && (
        <TextInput
          label="Proxy Rule"
          description="Traefik reverse proxy rules, mutually exclusive with domains."
          placeholder="Proxy Rule"
          icon={<TbAtom2 />}
          value={service.data.rule}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, rule: e.target.value }));
          }}
        />
      ),
    [service.data?.rule]
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

  const Middlewares = useMemo(
    () =>
      service.data && (
        <ObjectArrayInput
          label="Middlewares"
          description="Traefik middleware, for purposes such as authorization or flow restriction."
          placeholder="Middlewares Item"
          icon={<TbForbid />}
          value={service.data.middlewares}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, middlewares: value as any }));
          }}
          modals={(item, setItem) => [
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
              value={item.options}
              onChange={(value) => setItem({ ...item, options: value })}
            />,
          ]}
        />
      ),
    [service.data?.middlewares]
  );

  // parameters
  const Labels = useMemo(
    () =>
      service.data && (
        <RecordOnbuildInput
          label="Labels"
          description="Set metadata on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Labels Item Name"
          rightPlaceholder="Labels Item Value"
          value={service.data.labels.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            service.actions.update((prev) => ({
              ...prev,
              labels: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [service.data?.labels]
  );

  const Secrets = useMemo(
    () =>
      service.data && (
        <RecordOnbuildInput
          label="Secrets"
          description="Set secret on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Secrets Item Name"
          rightPlaceholder="Secrets Item Alias"
          value={service.data.secrets.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            service.actions.update((prev) => ({
              ...prev,
              secrets: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [service.data?.secrets]
  );

  const BuildArgs = useMemo(
    () =>
      service.data && (
        <RecordInput
          label="Build Args"
          description="Set build-time variables."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Build Args Item Name"
          rightPlaceholder="Build Args Item Value"
          value={Object.entries(service.data.buildArgs)}
          onChange={(value) => {
            service.actions.update((prev) => ({
              ...prev,
              buildArgs: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [service.data?.buildArgs]
  );

  // ports
  const Ports = useMemo(
    () =>
      service.data && (
        <AutocompleteArrayInput
          label="Ports"
          description="Publish a container's port(s) to the host."
          icon={<TbCircleDot />}
          placeholder="Host Port"
          value={service.data.ports}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, ports: value }));
          }}
          items={ports.data.map((i) => String(i))}
          select={(item, setItem) => ({
            limit: 100,
            value: item?.hport ? String(item?.hport) : undefined,
            onChange: (value: string) => {
              setItem({
                hport: parseInt(value),
                cport: item?.cport ?? 80,
                proto: item?.proto ?? "tcp",
              });
            },
          })}
          modals={(item, setItem) => [
            <NumberInput
              key="cport"
              placeholder="Container Port"
              icon={<TbCircleDot />}
              min={1}
              max={65535}
              readOnly={!item}
              value={item?.cport}
              onChange={(value) => {
                if (item) {
                  setItem({ ...item, cport: value ?? 80 });
                }
              }}
            />,
            <Select
              key="readonly"
              placeholder="Read Only"
              icon={<TbCertificate />}
              readOnly={!item}
              value={item?.proto}
              onChange={(value) => {
                if (item) {
                  setItem({ ...item, proto: value as "tcp" | "udp" });
                }
              }}
              data={[
                { label: "Protocol: TCP", value: "tcp" },
                { label: "Protocol: UDP", value: "udp" },
              ]}
            />,
          ]}
        />
      ),
    [service.data?.ports, ports.data]
  );

  // volumes
  const Volumes = useMemo(
    () =>
      service.data && (
        <AutocompleteArrayInput
          label="Volumes"
          description="Bind mount a volume."
          icon={<TbFolder />}
          placeholder="Host Path"
          value={service.data.volumes}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, volumes: value }));
          }}
          items={volumes.data}
          select={(item, setItem) => ({
            limit: 100,
            value: item?.hpath,
            onChange: (value: string) => {
              setItem({
                hpath: value,
                cpath: item?.cpath ?? "",
                readonly: item?.readonly ?? false,
              });
            },
          })}
          modals={(item, setItem) => [
            <TextInput
              key="cpath"
              placeholder="Container Path"
              icon={<TbFolder />}
              readOnly={!item}
              value={item?.cpath ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (item) {
                  setItem({ ...item, cpath: e.target.value });
                }
              }}
            />,
            <Select
              key="readonly"
              placeholder="Read Only"
              icon={<TbEditCircle />}
              readOnly={!item}
              value={item?.readonly ? "true" : "false"}
              onChange={(value) => {
                if (item) {
                  setItem({ ...item, readonly: value === "true" });
                }
              }}
              data={[
                { label: "Read Only: Yes", value: "true" },
                { label: "Read Only: No", value: "false" },
              ]}
            />,
          ]}
        />
      ),
    [service.data?.ports, ports.data]
  );

  // extensions
  const Extensions = useMemo(
    () =>
      service.data && (
        <ExtensionInput
          options={buildpacks.data[service.data.buildpack]?.options}
          value={service.data.extensions}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, extensions: value }));
          }}
        />
      ),
    [service.data?.buildpack, buildpacks.data, service.data?.extensions]
  );

  // others
  const Commands = useMemo(
    () =>
      service.data && (
        <ArrayInput
          label="Commands"
          description="Replace the service container start commands."
          placeholder="Commands Item"
          icon={<TbTerminal />}
          value={service.data.commands}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, commands: value }));
          }}
        />
      ),
    [service.data?.commands]
  );

  const EntryPoints = useMemo(
    () =>
      service.data && (
        <ArrayInput
          label="Entry Points"
          description="Replace the service container entry points."
          placeholder="Entry Points Item"
          icon={<TbTerminal />}
          value={service.data.entrypoints}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, entrypoints: value }));
          }}
        />
      ),
    [service.data?.entrypoints]
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

  const Init = useMemo(
    () =>
      service.data && (
        <Select
          label="Run an Init"
          description="Run an init inside the container that forwards signals."
          placeholder="Run an Init"
          icon={<TbInfinity />}
          value={service.data.init ? "true" : "false"}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, init: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [service.data?.init]
  );

  const Remove = useMemo(
    () =>
      service.data && (
        <Select
          label="Automatically Remove"
          description="Automatically remove the container when it exits."
          placeholder="Automatically Remove"
          icon={<TbPinnedOff />}
          value={service.data.rm ? "true" : "false"}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, rm: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [service.data?.rm]
  );

  const Privileged = useMemo(
    () =>
      service.data && (
        <Select
          label="Give privileges"
          description="Give extended privileges to this container."
          placeholder="Give privileges"
          icon={<TbComet />}
          value={service.data.privileged ? "true" : "false"}
          onChange={(value) => {
            service.actions.update((prev) => ({ ...prev, privileged: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [service.data?.privileged]
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

  const User = useMemo(
    () =>
      service.data && (
        <TextInput
          label="Username or UID"
          description="Username or UID (format: <name|uid>[:<group|gid>])."
          placeholder="Username or UID"
          icon={<TbUser />}
          value={service.data.user}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, user: e.target.value }));
          }}
        />
      ),
    [service.data?.user]
  );

  const Workdir = useMemo(
    () =>
      service.data && (
        <TextInput
          label="Working Directory"
          description="Working directory inside the container."
          placeholder="Working Directory"
          icon={<TbFolder />}
          value={service.data.workdir}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            service.actions.update((prev) => ({ ...prev, workdir: e.target.value }));
          }}
        />
      ),
    [service.data?.workdir]
  );

  const Networks = useMemo(
    () =>
      service.data && (
        <RecordInput
          label="Networks"
          description="Connect a container to a network."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Networks Item Name"
          rightPlaceholder="Networks Item Alias"
          value={Object.entries(service.data.networks)}
          onChange={(value) => {
            service.actions.update((prev) => ({
              ...prev,
              networks: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [service.data?.networks]
  );

  const Hosts = useMemo(
    () =>
      service.data && (
        <RecordOnbuildInput
          label="Hosts"
          description="Add a custom host-to-IP mapping."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Hosts Item Host"
          rightPlaceholder="Hosts Item IP"
          value={service.data.hosts.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            service.actions.update((prev) => ({
              ...prev,
              hosts: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [service.data?.hosts]
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
    <Async query={service.query}>
      <Stack>
        <Heading>General</Heading>
        {GeneralRow}
        <Heading>Extensions</Heading>
        {Extensions}
        <Heading>Requests</Heading>
        {DomainRow}
        {ProxyRow}
        {Middlewares}
        <Heading>Parameters</Heading>
        {Labels}
        {Secrets}
        {BuildArgs}
        <Heading>Binds</Heading>
        {Ports}
        {Volumes}
        <Heading>Others</Heading>
        {CommandsRow}
        {WorkingRow}
        {ModeRow}
        {Networks}
        {Hosts}
      </Stack>
    </Async>
  );
};
