import React, { useState } from "react";
import { usePlugins } from "../api/use-plugins";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { css } from "@emotion/react";
import { client } from "../api/client";
import { useCalling } from "../hooks/use-calling";
import { TbOutlet, TbSettings, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ListPluginResponse } from "@syfxlin/depker-client";
import { usePlugin } from "../api/use-plugin";
import { ExtensionInput } from "../components/input/ExtensionInput";

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
                  actions.success(`Save successful`, `Plugin settings save successful.`);
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
                    a.success(`Uninstall plugin successful`, `You can no longer use this plugin to create services.`);
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
  const t = useMantineTheme();
  const plugins = usePlugins();
  const [install, setInstall] = useState("");
  const calling = useCalling();
  return (
    <Stack>
      <Group>
        <TextInput
          placeholder="Plugin package name or package spec."
          icon={<TbOutlet />}
          value={install}
          onChange={(e) => setInstall(e.target.value)}
          disabled={calling.loading}
          css={css`
            flex: 1;
          `}
        />
        <Button
          loading={calling.loading}
          disabled={!install}
          onClick={() => {
            calling.calling(async (a) => {
              if (!install) {
                a.failure(`Install plugin failure`, `Please enter the package name of the plugin to be installed.`);
                return;
              }
              try {
                await plugins.actions.install({ name: install });
                a.success(`Install plugin successful`, `You can use this plugin when creating a service.`);
              } catch (e: any) {
                a.failure(`Install plugin failure`, e);
              }
            });
          }}
        >
          Install
        </Button>
      </Group>
      <Divider />
      <Async query={plugins.query}>
        {plugins.data && (
          <Pages
            page={plugins.values.page}
            size={plugins.values.size}
            total={plugins.data.total}
            onChange={plugins.update.page}
          >
            {plugins.data.items.map((item) => (
              <Group
                key={`plugins-${item.name}`}
                position="apart"
                css={css`
                  padding: ${t.spacing.sm}px ${t.spacing.md}px;
                  border-radius: ${t.radius.sm}px;
                  color: ${t.colorScheme === "light" ? t.colors.gray[7] : t.colors.dark[0]};

                  &:hover {
                    background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
                  }
                `}
              >
                <Group spacing="xs">
                  <Avatar size="xs" src={client.assets.icon(item.icon)} />
                  <Text weight={500}>{item.label ?? item.name}</Text>
                  {item.group && <Text weight={500}> ({item.group})</Text>}
                </Group>
                <Group spacing="xs">
                  <Badge color="indigo">buildpack: {item.buildpack ? "yes" : "no"}</Badge>
                  <Actions item={item} actions={plugins.actions} />
                </Group>
              </Group>
            ))}
          </Pages>
        )}
      </Async>
    </Stack>
  );
};
