import React, { ChangeEvent } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Menu,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useCalling } from "../hooks/use-calling";
import {
  TbBox,
  TbDashboard,
  TbEdit,
  TbList,
  TbPlayerPause,
  TbPlayerPlay,
  TbPlayerStop,
  TbPlus,
  TbRefresh,
  TbSquare,
  TbTrash,
} from "react-icons/all";
import { ListContainerResponse } from "@syfxlin/depker-client";
import { Lists, ListsFields, ListsItem } from "../components/layout/Lists";
import { humanDate } from "../utils/human";
import { useContainers } from "../api/use-containers";
import { colors } from "../api/use-status";
import { openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { useNavigate } from "react-router-dom";

const Actions: React.FC<{
  item: ListContainerResponse["items"][number];
  actions: ReturnType<typeof useContainers>["actions"];
}> = ({ item, actions }) => {
  const t = useMantineTheme();
  const navigate = useNavigate();
  const calling = useCalling();
  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Tooltip label="Operate">
            <ActionIcon size="lg" color={t.primaryColor}>
              <TbSquare />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Status</Menu.Label>
          <Menu.Item
            color="green"
            icon={<TbPlayerPlay />}
            disabled={item.state === "running"}
            onClick={() => {
              calling.calling(async (a) => {
                try {
                  await actions.start({ name: item.name });
                  a.success(`Start container successful`, `The container has been successfully started.`);
                } catch (e: any) {
                  a.failure(`Start container failure`, e);
                }
              });
            }}
          >
            Start
          </Menu.Item>
          <Menu.Item
            color="blue"
            icon={<TbRefresh />}
            onClick={() => {
              calling.calling(async (a) => {
                try {
                  await actions.restart({ name: item.name });
                  a.success(`Restart container successful`, `The container has been successfully restarted.`);
                } catch (e: any) {
                  a.failure(`Restart container failure`, e);
                }
              });
            }}
          >
            Restart
          </Menu.Item>
          <Menu.Item
            color="pink"
            icon={<TbPlayerStop />}
            disabled={item.state === "stopped" || item.state === "exited"}
            onClick={() => {
              calling.calling(async (a) => {
                try {
                  await actions.stop({ name: item.name });
                  a.success(`Stop container successful`, `The container has been successfully stopped.`);
                } catch (e: any) {
                  a.failure(`Stop container failure`, e);
                }
              });
            }}
          >
            Stop
          </Menu.Item>
          <Menu.Item
            color="red"
            icon={<TbPlayerPause />}
            disabled={item.state === "stopped" || item.state === "exited"}
            onClick={() => {
              calling.calling(async (a) => {
                try {
                  await actions.kill({ name: item.name });
                  a.success(`Kill container successful`, `The container has been successfully killed.`);
                } catch (e: any) {
                  a.failure(`Kill container failure`, e);
                }
              });
            }}
          >
            Kill
          </Menu.Item>
          <Menu.Label>Rename</Menu.Label>
          <Menu.Item
            icon={<TbEdit />}
            onClick={() => {
              openModal({
                title: "Delete Image",
                children: (
                  <ObjectModal
                    button="Delete"
                    value={{ name: item.name }}
                    onChange={async (value, a) => {
                      if (!value.name) {
                        a.failure(
                          `Rename container failure`,
                          `Please enter the container name of the container to be rename.`
                        );
                        return false;
                      }
                      try {
                        await actions.rename({ name: item.name, rename: value.name });
                        a.success(`Rename container successful`, `The container has been successfully rename.`);
                        return true;
                      } catch (e: any) {
                        a.failure(`Rename container failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(obj, setObj) => [
                      <TextInput
                        key="input:name"
                        required
                        label="Name"
                        description="Container name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                        placeholder="Container Name"
                        icon={<TbBox />}
                        value={obj.name ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setObj({ ...item, name: e.target.value })}
                      />,
                    ]}
                  </ObjectModal>
                ),
              });
            }}
          >
            Rename
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Tooltip label="Dashboard">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          onClick={() => {
            navigate(`/containers/${item.name}`);
          }}
        >
          <TbDashboard />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete">
        <ActionIcon
          size="lg"
          color="red"
          loading={calling.loading}
          disabled={item.state === "running"}
          onClick={() => {
            openConfirmModal({
              title: "Delete Container",
              children: <Text size="sm">This action is irreversible. Confirm delete?</Text>,
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.delete({ name: item.name });
                    a.success(`Delete container successful`, `The container has been successfully deleted.`);
                  } catch (e: any) {
                    a.failure(`Delete container failure`, e);
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

export const SettingContainersTab: React.FC = () => {
  const containers = useContainers();
  return (
    <Lists
      title="Containers"
      total={containers.data?.total}
      items={containers.data?.items}
      sorts={["id", "name", "image", "image_id", "created", "state", "status"]}
      query={containers.query}
      values={containers.values}
      update={containers.update}
      buttons={[
        <Button
          key="container:create"
          size="xs"
          leftIcon={<TbPlus />}
          onClick={() =>
            openModal({
              title: "Create Container",
              children: (
                <ObjectModal
                  button="Create"
                  value={{}}
                  onChange={async (value, actions) => {
                    if (!value.name || !value.commands) {
                      actions.failure(
                        `Create container failure`,
                        `Please enter the container name and run commands of the container to be created.`
                      );
                      return false;
                    }
                    try {
                      await containers.actions.create({ name: value.name, commands: value.commands });
                      actions.success(`Create container successful`, `The container has been successfully created.`);
                      return true;
                    } catch (e: any) {
                      actions.failure(`Create container failure`, e);
                      return false;
                    }
                  }}
                >
                  {(item, setItem) => [
                    <TextInput
                      key="input:name"
                      required
                      label="Name"
                      description="Container name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                      placeholder="Container Name"
                      icon={<TbEdit />}
                      value={item.name ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                    />,
                    <Textarea
                      key="input:arguments"
                      required
                      label="Arguments"
                      description="Docker run arguments"
                      placeholder="Docker Run Arguments"
                      autosize
                      minRows={2}
                      maxRows={5}
                      icon={<TbList />}
                      value={item.commands ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setItem({ ...item, commands: e.target.value })}
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
          key={`container:${item.id}`}
          left={<Text weight={500}>{item.name}</Text>}
          right={
            <>
              <Badge color="indigo">ID: {item.id.substring(0, 7)}</Badge>
              <Badge color="cyan">
                Image: {item.image.startsWith("sha256:") ? item.image.substring(0, 14) : item.image}
              </Badge>
              <Badge color={colors[item.state]}>Status: {item.status}</Badge>
              <Actions item={item} actions={containers.actions} />
            </>
          }
        >
          <ListsFields
            data={[
              ["ID", item.id],
              ["Name", item.name],
              ["Image", item.image],
              ["Image ID", item.imageId],
              ["Command", item.command],
              ["State", item.state],
              ["Status", item.status],
              ["Created Time", humanDate(item.created)],
              [
                "Labels",
                <Table key={`container:${item.id}:labels`} striped highlightOnHover withBorder withColumnBorders>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(item.labels).map(([k, v]) => (
                      <tr key={`container:${item.id}:labels:${k}`}>
                        <td>{k}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>,
              ],
              [
                "Ports",
                <Table key={`container:${item.id}:ports`} striped highlightOnHover withBorder withColumnBorders>
                  <thead>
                    <tr>
                      <th>IP</th>
                      <th>Host Port</th>
                      <th>Container Port</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.ports.map((p) => (
                      <tr key={`container:${item.id}:ports:${p.ip}:${p.hport}:${p.cport}:${p.type}`}>
                        <td>{p.ip || "-"}</td>
                        <td>{p.hport || "-"}</td>
                        <td>{p.cport || "-"}</td>
                        <td>{p.type || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>,
              ],
              [
                "Volumes",
                <Table key={`container:${item.id}:volumes`} striped highlightOnHover withBorder withColumnBorders>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Host Path</th>
                      <th>Container Path</th>
                      <th>Read Only</th>
                      <th>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.volumes.map((p) => (
                      <tr key={`container:${item.id}:volumes:${p.hpath}:${p.cpath}:${p.readonly}`}>
                        <td>{p.type || "-"}</td>
                        <td>{p.hpath || "-"}</td>
                        <td>{p.cpath || "-"}</td>
                        <td>{p.readonly ? "Yes" : "No"}</td>
                        <td>{p.mode || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>,
              ],
              [
                "Networks",
                <Table key={`container:${item.id}:networks`} striped highlightOnHover withBorder withColumnBorders>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mac</th>
                      <th>IPv4</th>
                      <th>IPv6</th>
                      <th>Aliases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.networks.map((n) => (
                      <tr key={`container:${item.id}:networks:${n.id}`}>
                        <td>{n.id}</td>
                        <td>{n.name}</td>
                        <td>{n.mac || "-"}</td>
                        <td>{n.ipv4 || "-"}</td>
                        <td>{n.ipv6 || "-"}</td>
                        <td>{n.aliases.join(", ") || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>,
              ],
            ]}
          />
        </ListsItem>
      )}
    </Lists>
  );
};
