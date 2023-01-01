import React, { useState } from "react";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import {
  ActionIcon,
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
import { useCalling } from "../hooks/use-calling";
import { TbList, TbOutlet, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ListNetworkResponse } from "@syfxlin/depker-client";
import { useNetworks } from "../api/use-networks";
import { Empty } from "../components/core/Empty";

const Containers: React.FC<{
  item: ListNetworkResponse["items"][number];
  actions: ReturnType<typeof useNetworks>["actions"];
}> = ({ item, actions }) => {
  const t = useMantineTheme();
  const [connect, setConnect] = useState("");
  const calling = useCalling();
  return (
    <Stack spacing="xs">
      <Group>
        <TextInput
          placeholder="Network name."
          icon={<TbOutlet />}
          value={connect}
          onChange={(e) => setConnect(e.target.value)}
          disabled={calling.loading}
          css={css`
            flex: 1;
          `}
        />
        <Button
          loading={calling.loading}
          disabled={!connect}
          onClick={() => {
            calling.calling(async (a) => {
              if (!connect) {
                a.failure(
                  `Connect network failure`,
                  `Please enter the container name of the container to be connected.`
                );
                return;
              }
              try {
                await actions.connect({ name: item.name, container: connect });
                setConnect("");
                closeAllModals();
                a.success(`Connect network successful`, `Container has successfully connected to the network.`);
              } catch (e: any) {
                a.failure(`Connect network failure`, e);
              }
            });
          }}
        >
          Connect
        </Button>
      </Group>
      <Divider />
      {item.containers.map((container) => (
        <Group
          key={`containers-${container.id}`}
          spacing="xs"
          position="apart"
          noWrap
          css={css`
            padding: ${t.spacing.sm}px ${t.spacing.md}px;
            border-radius: ${t.radius.sm}px;
            color: ${t.colorScheme === "light" ? t.colors.gray[7] : t.colors.dark[0]};

            &:hover {
              background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
            }
          `}
        >
          <Stack spacing="xs">
            <Text weight={500}>{container.name}</Text>
            <Group spacing="xs">
              <Tooltip label={container.id}>
                <Badge color="indigo">id: {container.id.substring(0, 7)}</Badge>
              </Tooltip>
              <Badge color="cyan">ip: {container.ip}</Badge>
              <Badge color="pink">mac: {container.mac}</Badge>
            </Group>
          </Stack>
          <Group spacing="xs">
            <Tooltip label="Delete">
              <ActionIcon
                size="lg"
                color="red"
                loading={calling.loading}
                onClick={() => {
                  openConfirmModal({
                    title: "Disconnect Network",
                    children: <Text size="sm">This action is irreversible. Confirm uninstall?</Text>,
                    labels: { confirm: "Disconnect", cancel: "No don't disconnect it" },
                    confirmProps: { color: "red" },
                    onConfirm: () => {
                      calling.calling(async (a) => {
                        try {
                          await actions.disconnect({ name: item.name, container: container.name });
                          closeAllModals();
                          a.success(
                            `Disconnect network successful`,
                            `Container has successfully disconnected to the network.`
                          );
                        } catch (e: any) {
                          a.failure(`Disconnect network failure`, e);
                        }
                      });
                    },
                  });
                }}
              >
                <TbTrash />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      ))}
      {!item.containers.length && <Empty />}
    </Stack>
  );
};

const Actions: React.FC<{
  item: ListNetworkResponse["items"][number];
  actions: ReturnType<typeof useNetworks>["actions"];
}> = ({ item, actions }) => {
  const t = useMantineTheme();
  const calling = useCalling();
  return (
    <>
      <Tooltip label="Containers">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          loading={calling.loading}
          disabled={!item.containers.length}
          onClick={() => {
            openModal({
              title: "Connected Containers",
              children: <Containers item={item} actions={actions} />,
            });
          }}
        >
          <TbList />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete">
        <ActionIcon
          size="lg"
          color="red"
          loading={calling.loading}
          disabled={["depker", "bridge", "host", "none"].includes(item.name)}
          onClick={() => {
            openConfirmModal({
              title: "Delete Network",
              children: <Text size="sm">This action is irreversible. Confirm uninstall?</Text>,
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.delete({ name: item.name });
                    a.success(`Delete network successful`, `You can no longer use this network to create services.`);
                  } catch (e: any) {
                    a.failure(`Delete network failure`, e);
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

export const SettingNetworksTab: React.FC = () => {
  const t = useMantineTheme();
  const networks = useNetworks();
  const [network, setNetwork] = useState("");
  const calling = useCalling();
  return (
    <Stack>
      <Group>
        <TextInput
          placeholder="Network name."
          icon={<TbOutlet />}
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          disabled={calling.loading}
          css={css`
            flex: 1;
          `}
        />
        <Button
          loading={calling.loading}
          disabled={!network}
          onClick={() => {
            calling.calling(async (a) => {
              if (!network) {
                a.failure(`Create network failure`, `Please enter the network name of the network to be created.`);
                return;
              }
              try {
                await networks.actions.create({ name: network });
                setNetwork("");
                a.success(`Create network successful`, `You can use this network when creating a service.`);
              } catch (e: any) {
                a.failure(`Create network failure`, e);
              }
            });
          }}
        >
          Create
        </Button>
      </Group>
      <Divider />
      <Async query={networks.query}>
        {networks.data && (
          <Pages
            page={networks.values.page}
            size={networks.values.size}
            total={networks.data.total}
            onChange={networks.update.page}
          >
            {networks.data.items.map((item) => (
              <Group
                key={`networks-${item.name}`}
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
                  <Text weight={500}>{item.name}</Text>
                </Group>
                <Group spacing="xs">
                  <Tooltip label={item.id}>
                    <Badge color="indigo">id: {item.id.substring(0, 7)}</Badge>
                  </Tooltip>
                  <Badge color="cyan">scope: {item.scope}</Badge>
                  <Badge color="pink">driver: {item.driver}</Badge>
                  <Actions item={item} actions={networks.actions} />
                </Group>
              </Group>
            ))}
          </Pages>
        )}
      </Async>
    </Stack>
  );
};
