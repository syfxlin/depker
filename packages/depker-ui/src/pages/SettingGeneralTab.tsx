import React, { ChangeEvent, useMemo } from "react";
import { useSettings } from "../api/use-settings";
import { Async } from "../components/core/Async";
import { Button, Divider, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { Heading } from "../components/parts/Heading";
import { TbAntennaBars5, TbApps, TbDownload, TbEqual, TbList } from "react-icons/all";
import { RecordInput } from "../components/input/RecordInput";
import { useCalling } from "../hooks/use-calling";

export const SettingGeneralTab: React.FC = () => {
  const settings = useSettings();
  const calling = useCalling();

  // infos
  const Email = useMemo(
    () =>
      settings.data && (
        <TextInput
          required
          label="Email"
          description="User's email, used for background task notification."
          placeholder="Email"
          icon={<TbApps />}
          type="email"
          value={settings.data.email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            settings.actions.update((prev) => ({ ...prev, email: e.target.value }));
          }}
        />
      ),
    [settings.data?.email]
  );

  const User = useMemo(
    () =>
      settings.data && (
        <TextInput
          required
          label="User"
          description="User name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
          placeholder="User Name"
          icon={<TbApps />}
          value={settings.data.username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            settings.actions.update((prev) => ({ ...prev, username: e.target.value }));
          }}
        />
      ),
    [settings.data?.username]
  );

  const Upgrade = useMemo(
    () =>
      settings.data && (
        <Select
          label="Upgrade"
          description="Whether to update traefik on depker startup."
          placeholder="Upgrade"
          icon={<TbDownload />}
          value={settings.data.upgrade ? "true" : "false"}
          onChange={(value) => {
            settings.actions.update((prev) => ({ ...prev, upgrade: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [settings.data?.upgrade]
  );

  const Purge = useMemo(
    () =>
      settings.data && (
        <Select
          label="Purge"
          description="Whether to clear residual docker volume and docker image after deployment."
          placeholder="Pull Image"
          icon={<TbDownload />}
          value={settings.data.purge ? "true" : "false"}
          onChange={(value) => {
            settings.actions.update((prev) => ({ ...prev, purge: value === "true" }));
          }}
          data={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      ),
    [settings.data?.purge]
  );

  const Concurrency = useMemo(
    () =>
      settings.data && (
        <NumberInput
          label="Concurrency"
          description="Concurrency of deployment tasks."
          placeholder="Concurrency"
          icon={<TbAntennaBars5 />}
          min={1}
          max={10}
          value={settings.data.concurrency}
          onChange={(value) => {
            settings.actions.update((prev) => ({ ...prev, concurrency: value ?? 1 }));
          }}
        />
      ),
    [settings.data?.concurrency]
  );

  const Dashboard = useMemo(
    () =>
      settings.data && (
        <TextInput
          label="Dashboard"
          description="Domain of the Traefik dashboard, if not filled, the dashboard will not be exposed."
          placeholder="Dashboard"
          icon={<TbApps />}
          value={settings.data.dashboard}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            settings.actions.update((prev) => ({ ...prev, dashboard: e.target.value }));
          }}
        />
      ),
    [settings.data?.dashboard]
  );

  const CertificatesType = useMemo(
    () =>
      settings.data && (
        <TextInput
          required
          label="Certificates Type"
          description="Provider for TLS certificate, see Traefik documentation."
          placeholder="Certificates Type"
          icon={<TbApps />}
          value={settings.data.tls.type}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            settings.actions.update((prev) => ({ ...prev, tls: { ...prev.tls, type: e.target.value } }));
          }}
        />
      ),
    [settings.data?.tls.type]
  );

  const CertificatesEnv = useMemo(
    () =>
      settings.data && (
        <RecordInput
          label="Certificates Environment Variables"
          description="Environment Variables for TLS certificate, see Traefik documentation."
          leftPlaceholder="Certificates Environment Key"
          rightPlaceholder="Certificates Environment Value"
          leftIcon={<TbList />}
          rightIcon={<TbEqual />}
          value={Object.entries(settings.data.tls.env ?? {})}
          onChange={(value) => {
            settings.actions.update((prev) => ({
              ...prev,
              tls: { ...prev.tls, env: value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}) },
            }));
          }}
        />
      ),
    [settings.data?.tls.env]
  );

  const Save = useMemo(
    () => (
      <Button
        loading={calling.loading}
        onClick={() => {
          calling.calling(async (actions) => {
            try {
              await settings.actions.save();
              actions.success(`Save successful`, `The settings has been successfully saved.`);
            } catch (e: any) {
              actions.failure(`Save failure`, e);
            }
          });
        }}
      >
        Save
      </Button>
    ),
    [calling.loading, settings.actions.save]
  );

  return (
    <Async query={settings.query}>
      <Stack>
        <Heading>Infos</Heading>
        {Email}
        {User}
        <Heading>Options</Heading>
        {Upgrade}
        {Purge}
        {Concurrency}
        {Dashboard}
        <Heading>Certificates</Heading>
        {CertificatesType}
        {CertificatesEnv}
      </Stack>
      <Divider my="md" />
      {Save}
    </Async>
  );
};
