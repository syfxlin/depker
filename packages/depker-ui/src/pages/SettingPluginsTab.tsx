import React, { ChangeEvent } from "react";
import { usePlugins } from "../api/use-plugins";
import { Async } from "../components/core/Async";
import { ActionIcon, Avatar, Badge, Button, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { client } from "../api/client";
import { useCalling } from "../hooks/use-calling";
import { TbOutlet, TbPlus, TbSettings, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ListPluginResponse } from "@syfxlin/depker-client";
import { usePlugin } from "../api/use-plugin";
import { ExtensionInput } from "../components/input/ExtensionInput";
import { Lists, ListsFields, ListsItem } from "../components/layout/Lists";
import { ObjectModal } from "../components/input/ObjectModal";

const Setting: React.FC<{ name: string }> = ({ name }) => {
  const plugin = usePlugin(name);
  const calling = useCalling();
  return (
    <Async query={plugin.query}>
      {plugin.data && (
        <Stack>
          <ExtensionInput
            options={plugin.data.options}
            value={plugin.data.values}
            onChange={(value) => plugin.actions.update(() => value)}
          />
          <Button
            mt="xs"
            fullWidth
            loading={calling.loading}
            onClick={() => {
              calling.calling(async (actions) => {
                try {
                  await plugin.actions.save();
                  closeAllModals();
                  actions.success(`Save successful`, `The plugin settings has been successfully saved.`);
                } catch (e: any) {
                  actions.failure(`Save failure`, e);
                }
              });
            }}
          >
            Save
          </Button>
        </Stack>
      )}
    </Async>
  );
};

const Actions: React.FC<{
  item: ListPluginResponse["items"][number];
  actions: ReturnType<typeof usePlugins>["actions"];
}> = ({ item, actions }) => {
  const t = useMantineTheme();
  const calling = useCalling();
  return (
    <>
      <Tooltip label="Setting">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          loading={calling.loading}
          disabled={!item.options}
          onClick={() => {
            openModal({
              title: "Setting Plugin",
              children: <Setting name={item.name} />,
            });
          }}
        >
          <TbSettings />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Uninstall">
        <ActionIcon
          size="lg"
          color="red"
          loading={calling.loading}
          onClick={() => {
            openConfirmModal({
              title: "Uninstall Plugin",
              children: (
                <>
                  <Text size="sm" color="red">
                    Plugins can only be uninstalled when not in use.
                  </Text>
                  <Text size="sm">This action is irreversible. Confirm uninstall?</Text>
                </>
              ),
              labels: { confirm: "Uninstall", cancel: "No don't uninstall it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.uninstall({ name: item.name });
                    a.success(`Uninstall plugin successful`, `The plugin has been successfully uninstalled.`);
                  } catch (e: any) {
                    a.failure(`Uninstall plugin failure`, e);
                  }
                });
              },
            });
          }}
        >
          <TbTrash />
        </ActionIcon>
      </Tooltip>
    </>
  );
};

export const SettingPluginsTab: React.FC = () => {
  const plugins = usePlugins();
  return (
    <Lists
      title="Plugins"
      total={plugins.data?.total}
      items={plugins.data?.items}
      sorts={["name"]}
      query={plugins.query}
      values={plugins.values}
      update={plugins.update}
      buttons={[
        <Button
          key="plugin:install"
          size="xs"
          leftIcon={<TbPlus />}
          onClick={() =>
            openModal({
              title: "Install Plugin",
              children: (
                <ObjectModal
                  button="Install"
                  value={{}}
                  onChange={async (value, actions) => {
                    if (!value.name) {
                      actions.failure(
                        `Install plugin failure`,
                        `Please enter the package name of the plugin to be installed.`
                      );
                      return false;
                    }
                    try {
                      await plugins.actions.install({ name: value.name });
                      actions.success(`Install plugin successful`, `The plugin has been successfully installed.`);
                      return true;
                    } catch (e: any) {
                      actions.failure(`Install plugin failure`, e);
                      return false;
                    }
                  }}
                >
                  {(item, setItem) => [
                    <TextInput
                      key="input:name"
                      required
                      label="Name"
                      description="Plugin package spec, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                      placeholder="Plugin Package Spec"
                      icon={<TbOutlet />}
                      value={item.name ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                    />,
                  ]}
                </ObjectModal>
              ),
            })
          }
        >
          Install
        </Button>,
      ]}
    >
      {(item) => (
        <ListsItem
          key={`plugin:${item.name}`}
          left={
            <>
              <Avatar size="xs" src={client.assets.icon(item.icon)} />
              <Text weight={500}>{item.label ?? item.name}</Text>
            </>
          }
          right={
            <>
              <Badge color="indigo">Group: {item.group ?? "No"}</Badge>
              <Badge color="cyan">Buildpack: {item.buildpack ? "Yes" : "No"}</Badge>
              <Actions item={item} actions={plugins.actions} />
            </>
          }
        >
          <ListsFields
            data={[
              ["Spec", item.pkg],
              ["Name", item.name],
              ["Group", item.group || "-"],
              ["Buildpack Support", item.buildpack ? "Yes" : "No"],
              ["Global Options", item.options ? "Yes" : "No"],
            ]}
          />
        </ListsItem>
      )}
    </Lists>
  );
};
