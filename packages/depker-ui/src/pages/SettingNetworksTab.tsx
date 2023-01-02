import React, { ChangeEvent, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
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
import { TbList, TbNetwork, TbOutlet, TbPlugConnected, TbPlus, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ListNetworkResponse } from "@syfxlin/depker-client";
import { useNetworks } from "../api/use-networks";
import { Empty } from "../components/core/Empty";
import { Lists, ListsFields, ListsItem } from "../components/layout/Lists";
import { ObjectModal } from "../components/input/ObjectModal";

const Containers: React.FC<{
  item: ListNetworkResponse["items"][number];
  actions: ReturnType<typeof useNetworks>["actions"];
}> = ({ item, actions }) => {
  const t = useMantineTheme();
  const [connect, setConnect] = useState("");
  const calling = useCalling();
  return (
    <Stack spacing="xs">
      <Group spacing="xs">
        <TextInput
          size="xs"
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
          size="xs"
          color={t.primaryColor}
          loading={calling.loading}
          disabled={!connect}
          leftIcon={<TbPlugConnected />}
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
      <Box>
        {item.containers.map((container) => (
          <ListsItem
            key={`containers-${container.id}`}
            left={<Text weight={500}>{container.name}</Text>}
            right={
              <>
                <Badge color="indigo">id: {container.id.substring(0, 7)}</Badge>
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
              </>
            }
          >
            <ListsFields
              data={[
                ["ID", container.id],
                ["IP", container.ip],
                ["MAC", container.mac],
              ]}
            />
          </ListsItem>
        ))}
        {!item.containers.length && <Empty />}
      </Box>
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
  const networks = useNetworks();
  return (
    <Lists
      title="Networks"
      total={networks.data?.total ?? 0}
      items={networks.data?.items ?? []}
      sorts={["name", "id", "scope", "driver"]}
      query={networks.query}
      values={networks.values}
      update={networks.update}
      buttons={[
        <Button
          key="create-networks"
          size="xs"
          leftIcon={<TbPlus />}
          onClick={() =>
            openModal({
              title: "Create Network",
              children: (
                <ObjectModal
                  value={{}}
                  onChange={async (value, actions) => {
                    if (!value.name) {
                      actions.failure(
                        `Create network failure`,
                        `Please enter the network name of the network to be created.`
                      );
                      return false;
                    }
                    try {
                      await networks.actions.create({ name: value.name });
                      actions.success(`Create network successful`, `You can use this network when creating a service.`);
                      return true;
                    } catch (e: any) {
                      actions.failure(`Create network failure`, e);
                      return false;
                    }
                  }}
                >
                  {(item, setItem) => [
                    <TextInput
                      key="name"
                      required
                      label="Name"
                      description="Network name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                      placeholder="Network Name"
                      icon={<TbNetwork />}
                      value={item.name ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                    />,
                  ]}
                </ObjectModal>
              ),
            })
          }
        >
          Create
        </Button>,
      ]}
    >
      {(item) => (
        <ListsItem
          key={`networks-${item.name}`}
          left={<Text weight={500}>{item.name}</Text>}
          right={
            <>
              <Badge color="indigo">ID: {item.id.substring(0, 7)}</Badge>
              <Badge color="cyan">Driver: {item.driver}</Badge>
              <Badge color="pink">Binds: {item.containers.length}</Badge>
              <Actions item={item} actions={networks.actions} />
            </>
          }
        >
          <ListsFields
            data={[
              ["ID", item.id],
              ["Driver", item.driver],
              ["Scope", item.scope],
              ["IP Gateway", item.ips.map((i) => i.gateway).join(", ")],
              ["IP Subnet", item.ips.map((i) => i.subnet).join(", ")],
            ]}
          />
        </ListsItem>
      )}
    </Lists>
  );
};
