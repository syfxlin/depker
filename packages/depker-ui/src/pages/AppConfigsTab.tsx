import React, { ChangeEvent, forwardRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAllBuildpacks } from "../api/use-all-buildpacks";
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
  TbEditCircle,
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
import { useAllPorts } from "../api/use-all-ports";
import { SelectArrayInput } from "../components/input/SelectArrayInput";
import { useAllVolumes } from "../api/use-all-volumes";
import { openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { AppSettingContext } from "./AppSetting";
import { ExtensionInput } from "../components/input/ExtensionInput";
import { Heading } from "../components/parts/Heading";
import { client } from "../api/client";

export const AppConfigsTab: React.FC = () => {
  const { app } = useOutletContext<AppSettingContext>();
  const buildpacks = useAllBuildpacks();
  const ports = useAllPorts();
  const volumes = useAllVolumes();

  // general
  const Name = useMemo(
    () =>
      app.data && (
        <TextInput
          required
          label="Name"
          description="Application name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
          placeholder="Application Name"
          icon={<TbApps />}
          value={app.data.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            app.actions.update((prev) => ({ ...prev, name: e.target.value }));
          }}
        />
      ),
    [app.data?.name]
  );

  const Buildpacks = useMemo(
    () =>
      app.data && (
        <Select
          required
          searchable
          label="Buildpack"
          description="Building application with build package."
          placeholder="Build Package"
          nothingFound="No packages"
          icon={<Avatar size="xs" src={client.assets.icon(buildpacks.data[app.data.buildpack]?.icon)} />}
          value={app.data.buildpack}
          onChange={(value: string) => {
            const buildpack = buildpacks.data[value];
            if (!buildpack) {
              return;
            }
            app.actions.update((prev) => ({ ...prev, buildpack: value, extensions: {} }));
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
    [app.data?.buildpack, buildpacks.data]
  );

  const Image = useMemo(
    () =>
      app.data?.buildpack === "image" && (
        <ExtensionInput
          options={buildpacks.data[app.data.buildpack]?.options}
          value={app.data.extensions}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, extensions: value }));
          }}
        />
      ),
    [app.data?.buildpack, app.data?.extensions]
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

  const RestartPolicy = useMemo(
    () =>
      app.data && (
        <Select
          label="Restart Policy"
          description="Restart policy to apply when a container exits."
          placeholder="Restart Policy"
          icon={<TbRefreshAlert />}
          value={app.data.restart}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, restart: value as any }));
          }}
          data={[
            { label: "No", value: "no" },
            { label: "Always", value: "always" },
            { label: "On-Failure", value: "on-failure" },
          ]}
        />
      ),
    [app.data?.restart]
  );

  const PullImage = useMemo(
    () =>
      app.data && (
        <Select
          label="Pull Image"
          description="Pull image before running."
          placeholder="Pull Image"
          icon={<TbDownload />}
          value={app.data.pull ? "true" : "false"}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, pull: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [app.data?.pull]
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

  const HealthCheck = useMemo(
    () =>
      app.data && (
        <ObjectInput
          label="Health Check"
          description="Container Health Check Configurations."
          placeholder="Health Check"
          icon={<TbActivity />}
          value={app.data.healthcheck}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, healthcheck: value as any }));
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
    [app.data?.healthcheck]
  );

  // requests
  const Domains = useMemo(
    () =>
      app.data && (
        <ArrayInput
          label="Domains"
          description="Domain name used to access the application."
          placeholder="Domains Item"
          icon={<TbLink />}
          value={app.data.domain}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, domain: value }));
          }}
        />
      ),
    [app.data?.domain]
  );

  const EnableTLS = useMemo(
    () =>
      app.data && (
        <Select
          label="Enable TLS"
          description="Whether to enable tls support."
          placeholder="Enable TLS"
          icon={<TbCertificate />}
          value={app.data.tls ? "true" : "false"}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, tls: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [app.data?.tls]
  );

  const ProxyPort = useMemo(
    () =>
      app.data && (
        <NumberInput
          label="Proxy Port"
          description="Traefik reverse proxy access to the container port."
          placeholder="Proxy Port"
          icon={<TbCircleDot />}
          min={1}
          max={65535}
          value={app.data.port}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, port: value ?? 3000 }));
          }}
        />
      ),
    [app.data?.port]
  );

  const ProxyScheme = useMemo(
    () =>
      app.data && (
        <TextInput
          label="Proxy Scheme"
          description="Protocol used by Traefik Reverse Proxy to access containers."
          placeholder="Proxy Scheme"
          icon={<TbAtom2 />}
          value={app.data.scheme}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            app.actions.update((prev) => ({ ...prev, scheme: e.target.value }));
          }}
        />
      ),
    [app.data?.scheme]
  );

  const ProxyRule = useMemo(
    () =>
      app.data && (
        <TextInput
          label="Proxy Rule"
          description="Traefik reverse proxy rules, mutually exclusive with domains."
          placeholder="Proxy Rule"
          icon={<TbAtom2 />}
          value={app.data.rule}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            app.actions.update((prev) => ({ ...prev, rule: e.target.value }));
          }}
        />
      ),
    [app.data?.rule]
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
      app.data && (
        <ObjectArrayInput
          label="Middlewares"
          description="Traefik middleware, for purposes such as authorization or flow restriction."
          placeholder="Middlewares Item"
          icon={<TbForbid />}
          value={app.data.middlewares}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, middlewares: value as any }));
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
    [app.data?.middlewares]
  );

  // parameters
  const Labels = useMemo(
    () =>
      app.data && (
        <RecordOnbuildInput
          label="Labels"
          description="Set metadata on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Labels Item Name"
          rightPlaceholder="Labels Item Value"
          value={app.data.labels.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            app.actions.update((prev) => ({
              ...prev,
              labels: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [app.data?.labels]
  );

  const Secrets = useMemo(
    () =>
      app.data && (
        <RecordOnbuildInput
          label="Secrets"
          description="Set secret on a container."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Secrets Item Name"
          rightPlaceholder="Secrets Item Alias"
          value={app.data.secrets.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            app.actions.update((prev) => ({
              ...prev,
              secrets: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [app.data?.secrets]
  );

  const BuildArgs = useMemo(
    () =>
      app.data && (
        <RecordInput
          label="Build Args"
          description="Set build-time variables."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Build Args Item Name"
          rightPlaceholder="Build Args Item Value"
          value={Object.entries(app.data.buildArgs)}
          onChange={(value) => {
            app.actions.update((prev) => ({
              ...prev,
              buildArgs: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [app.data?.buildArgs]
  );

  // ports
  const Ports = useMemo(
    () =>
      app.data && (
        <SelectArrayInput
          label="Ports"
          description="Publish a container's port(s) to the host."
          icon={<TbCircleDot />}
          placeholder="Host Port"
          value={app.data.ports}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, ports: value }));
          }}
          items={Object.values(ports.data).map((i) => ({
            value: i.name,
            label: i.name,
            // prettier-ignore
            description: `${i.proto.toUpperCase()}:${i.port}. ${i.binds.length ? `Used by ${i.binds.join(", ")}` : `No used`}.`,
          }))}
          select={(item, setItem) => ({
            value: item?.name,
            onChange: (value: string) => {
              const port = ports.data[value];
              if (port) {
                setItem({
                  name: port.name,
                  proto: port.proto,
                  hport: port.port,
                  cport: item?.cport ?? 3000,
                });
              }
            },
            onCreate: (query: string) => {
              openModal({
                title: <>Create Port {query}</>,
                children: (
                  <ObjectModal
                    value={{ name: query }}
                    onChange={async (value, actions) => {
                      if (!value.name || !value.proto || !value.port) {
                        actions.failure(`Create port failure`, `Name, Protocol, Port must be not empty.`);
                        return false;
                      }
                      try {
                        await ports.actions.create({
                          name: value.name,
                          proto: value.proto,
                          port: value.port,
                        });
                        setItem({
                          name: value.name,
                          proto: value.proto,
                          hport: value.port,
                          cport: item?.cport ?? 3000,
                        });
                        actions.success(`Create port successful`, `Close modals...`);
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create port failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <TextInput
                        key="name"
                        required
                        label="Host Port Name"
                        description="The name used by host port proxy."
                        placeholder="Host Port Name"
                        icon={<TbSignature />}
                        value={item.name ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                      />,
                      <Select
                        key="protocol"
                        label="Host Port Protocol."
                        description="The protocol used by host port proxy."
                        placeholder="Host Port Protocol"
                        icon={<TbCertificate />}
                        value={item.proto}
                        onChange={(value) => setItem({ ...item, proto: value })}
                        data={[
                          { label: "TCP", value: "tcp" },
                          { label: "UDP", value: "udp" },
                        ]}
                      />,
                      <NumberInput
                        key="hport"
                        label="Host Port Number"
                        description="The port used by host port proxy."
                        placeholder="Host Port Number"
                        icon={<TbCircleDot />}
                        min={1}
                        max={65535}
                        value={item.port}
                        onChange={(value) => setItem({ ...item, port: value ?? 3000 })}
                      />,
                    ]}
                  </ObjectModal>
                ),
              });
              return null;
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
                  setItem({ ...item, cport: value ?? 3000 });
                }
              }}
            />,
          ]}
        />
      ),
    [app.data?.ports, ports.data]
  );

  // volumes
  const Volumes = useMemo(
    () =>
      app.data && (
        <SelectArrayInput
          label="Volumes"
          description="Bind mount a volume."
          icon={<TbFolder />}
          placeholder="Host Path"
          value={app.data.volumes}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, volumes: value }));
          }}
          items={Object.values(volumes.data).map((i) => ({
            value: i.name,
            label: i.name,
            // prettier-ignore
            description: `${!i.global ? "@" : ""}${i.path}. ${i.binds.length ? `Used by ${i.binds.join(", ")}` : `No used`}.`,
          }))}
          select={(item, setItem) => ({
            value: item?.name,
            onChange: (value: string) => {
              const volume = volumes.data[value];
              if (volume) {
                setItem({
                  name: volume.name,
                  global: volume.global,
                  hpath: volume.path,
                  cpath: item?.cpath ?? "",
                  readonly: item?.readonly ?? false,
                });
              }
            },
            onCreate: (query: string) => {
              openModal({
                title: <>Create Volume {query}</>,
                children: (
                  <ObjectModal
                    value={{ name: query }}
                    onChange={async (value, actions) => {
                      if (!value.name || !value.path || !value.global) {
                        actions.failure(`Create volume failure`, `Name, Path, Global must be not empty.`);
                        return false;
                      }
                      try {
                        await volumes.actions.create({
                          name: value.name,
                          path: value.path,
                          global: value.global,
                        });
                        setItem({
                          name: value.name,
                          global: value.global,
                          hpath: value.path,
                          cpath: item?.cpath ?? "",
                          readonly: item?.readonly ?? false,
                        });
                        actions.success(`Create volume successful`, `Close modals...`);
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create volume failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <TextInput
                        key="name"
                        required
                        label="Host Volume Name"
                        description="The name used by host volume."
                        placeholder="Host Volume Name"
                        icon={<TbSignature />}
                        value={item.name ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                      />,
                      <Select
                        key="global"
                        label="Host Volume Global."
                        description="Whether it is a global volume, that is, no mapping."
                        placeholder="Host Volume Global"
                        icon={<TbCertificate />}
                        value={item.global}
                        onChange={(value) => setItem({ ...item, global: value === "true" })}
                        data={[
                          { label: "Yes", value: "true" },
                          { label: "No", value: "false" },
                        ]}
                      />,
                      <TextInput
                        key="hpath"
                        required
                        label="Host Volume Path"
                        description="The path used by host volume."
                        placeholder="Host Volume Path"
                        icon={<TbFolder />}
                        value={item.path ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, path: e.target.value })}
                      />,
                    ]}
                  </ObjectModal>
                ),
              });
              return null;
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
    [app.data?.ports, ports.data]
  );

  // extensions
  const Extensions = useMemo(
    () =>
      app.data && (
        <ExtensionInput
          options={buildpacks.data[app.data.buildpack]?.options}
          value={app.data.extensions}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, extensions: value }));
          }}
        />
      ),
    [app.data?.buildpack, buildpacks.data, app.data?.extensions]
  );

  // others
  const Commands = useMemo(
    () =>
      app.data && (
        <ArrayInput
          label="Commands"
          description="Replace the application container start commands."
          placeholder="Commands Item"
          icon={<TbTerminal />}
          value={app.data.commands}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, commands: value }));
          }}
        />
      ),
    [app.data?.commands]
  );

  const EntryPoints = useMemo(
    () =>
      app.data && (
        <ArrayInput
          label="Entry Points"
          description="Replace the application container entry points."
          placeholder="Entry Points Item"
          icon={<TbTerminal />}
          value={app.data.entrypoints}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, entrypoints: value }));
          }}
        />
      ),
    [app.data?.entrypoints]
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
      app.data && (
        <Select
          label="Run an Init"
          description="Run an init inside the container that forwards signals."
          placeholder="Run an Init"
          icon={<TbInfinity />}
          value={app.data.init ? "true" : "false"}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, init: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [app.data?.init]
  );

  const Remove = useMemo(
    () =>
      app.data && (
        <Select
          label="Automatically Remove"
          description="Automatically remove the container when it exits."
          placeholder="Automatically Remove"
          icon={<TbPinnedOff />}
          value={app.data.rm ? "true" : "false"}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, rm: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [app.data?.rm]
  );

  const Privileged = useMemo(
    () =>
      app.data && (
        <Select
          label="Give privileges"
          description="Give extended privileges to this container."
          placeholder="Give privileges"
          icon={<TbComet />}
          value={app.data.privileged ? "true" : "false"}
          onChange={(value) => {
            app.actions.update((prev) => ({ ...prev, privileged: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [app.data?.privileged]
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
      app.data && (
        <TextInput
          label="Username or UID"
          description="Username or UID (format: <name|uid>[:<group|gid>])."
          placeholder="Username or UID"
          icon={<TbUser />}
          value={app.data.user}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            app.actions.update((prev) => ({ ...prev, user: e.target.value }));
          }}
        />
      ),
    [app.data?.user]
  );

  const Workdir = useMemo(
    () =>
      app.data && (
        <TextInput
          label="Working Directory"
          description="Working directory inside the container."
          placeholder="Working Directory"
          icon={<TbFolder />}
          value={app.data.workdir}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            app.actions.update((prev) => ({ ...prev, workdir: e.target.value }));
          }}
        />
      ),
    [app.data?.workdir]
  );

  const Networks = useMemo(
    () =>
      app.data && (
        <RecordInput
          label="Networks"
          description="Connect a container to a network."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Networks Item Name"
          rightPlaceholder="Networks Item Alias"
          value={Object.entries(app.data.networks)}
          onChange={(value) => {
            app.actions.update((prev) => ({
              ...prev,
              networks: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
            }));
          }}
        />
      ),
    [app.data?.networks]
  );

  const Hosts = useMemo(
    () =>
      app.data && (
        <RecordOnbuildInput
          label="Hosts"
          description="Add a custom host-to-IP mapping."
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          leftPlaceholder="Hosts Item Host"
          rightPlaceholder="Hosts Item IP"
          value={app.data.hosts.map((i) => [i.name, i.value, i.onbuild])}
          onChange={(value) => {
            app.actions.update((prev) => ({
              ...prev,
              hosts: value.map(([name, value, onbuild]) => ({ name, value, onbuild })),
            }));
          }}
        />
      ),
    [app.data?.hosts]
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
    <Async query={app.query}>
      <Stack>
        <Heading>General</Heading>
        {BasicRow}
        {Image}
        {PolicyRow}
        {HealthCheck}
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
        <Heading>Extensions</Heading>
        {Extensions}
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
