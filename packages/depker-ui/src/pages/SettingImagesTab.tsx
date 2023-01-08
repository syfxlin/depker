import React, { ChangeEvent } from "react";
import { ActionIcon, Badge, Button, Select, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { useCalling } from "../hooks/use-calling";
import { TbList, TbPackgeImport, TbPlus, TbTrash } from "react-icons/all";
import { openModal } from "@mantine/modals";
import { ListImageResponse } from "@syfxlin/depker-client";
import { Lists, ListsFields, ListsItem } from "../components/layout/Lists";
import { ObjectModal } from "../components/input/ObjectModal";
import { humanBytes, humanDate } from "../utils/human";
import { useImages } from "../api/use-images";
import { Empty } from "../components/core/Empty";

const Containers: React.FC<{
  item: ListImageResponse["items"][number];
}> = ({ item }) => {
  return (
    <Stack spacing="xs">
      {item.containers.map((container) => (
        <ListsItem
          key={`image:${item.id}:container:${container.id}`}
          left={<Text weight={500}>{container.name}</Text>}
          right={
            <>
              <Badge color="indigo">ID: {container.id.substring(0, 7)}</Badge>
              <Badge color="cyan">
                Tag: {container.image.startsWith("sha256:") ? container.image.substring(0, 14) : container.image}
              </Badge>
            </>
          }
        >
          <ListsFields
            data={[
              ["ID", container.id],
              ["Name", container.name],
              ["Tag", container.image],
            ]}
          />
        </ListsItem>
      ))}
      {!item.containers.length && <Empty />}
    </Stack>
  );
};

const Actions: React.FC<{
  item: ListImageResponse["items"][number];
  actions: ReturnType<typeof useImages>["actions"];
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
              title: "Used Containers",
              children: <Containers item={item} />,
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
          onClick={() => {
            openModal({
              title: "Delete Image",
              children: (
                <ObjectModal
                  button="Delete"
                  value={{ name: item.tags.length ? item.tags[0] : "<none>:<none>" }}
                  onChange={async (value, a) => {
                    if (!value.name) {
                      a.failure(`Delete image failure`, `Please enter the image name of the image to be deleted.`);
                      return false;
                    }
                    try {
                      await actions.delete({ name: value.name === "<none>:<none>" ? item.id : value.name });
                      a.success(`Delete image successful`, `The image has been successfully deleted.`);
                      return true;
                    } catch (e: any) {
                      a.failure(`Delete image failure`, e);
                      return false;
                    }
                  }}
                >
                  {(obj, setObj) => [
                    <Select
                      key="input:name"
                      required
                      label="Name"
                      description="Image name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                      placeholder="Image Name"
                      icon={<TbPackgeImport />}
                      data={item.tags}
                      value={obj.name ?? ""}
                      onChange={(value) => setObj({ ...obj, name: value })}
                    />,
                  ]}
                </ObjectModal>
              ),
            });
          }}
        >
          <TbTrash />
        </ActionIcon>
      </Tooltip>
    </>
  );
};

export const SettingImagesTab: React.FC = () => {
  const images = useImages();
  return (
    <Lists
      title="Images"
      total={images.data?.total}
      items={images.data?.items}
      sorts={["id", "tags", "created", "size"]}
      query={images.query}
      values={images.values}
      update={images.update}
      buttons={[
        <Button
          key="image:pull"
          size="xs"
          leftIcon={<TbPlus />}
          onClick={() =>
            openModal({
              title: "Pull Image",
              children: (
                <ObjectModal
                  button="Pull"
                  value={{}}
                  onChange={async (value, actions) => {
                    if (!value.name) {
                      actions.failure(`Pull image failure`, `Please enter the image name of the image to be pulled.`);
                      return false;
                    }
                    try {
                      await images.actions.create({ name: value.name });
                      actions.success(`Pull image successful`, `The image has been successfully pulled.`);
                      return true;
                    } catch (e: any) {
                      actions.failure(`Pull image failure`, e);
                      return false;
                    }
                  }}
                >
                  {(item, setItem) => [
                    <TextInput
                      key="input:name"
                      required
                      label="Name"
                      description="Image name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                      placeholder="Image Name"
                      icon={<TbPackgeImport />}
                      value={item.name ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                    />,
                  ]}
                </ObjectModal>
              ),
            })
          }
        >
          Pull
        </Button>,
      ]}
    >
      {(item) => (
        <ListsItem
          key={`image:${item.id}`}
          left={<Text weight={500}>{item.id.substring(7, 14)}</Text>}
          right={
            <>
              {item.tags.length && <Badge color="indigo">Name: {item.tags[0]}</Badge>}
              <Badge color="cyan">Size: {humanBytes(item.size)}</Badge>
              <Badge color="blue">Tags: {item.tags.length}</Badge>
              <Badge color="pink">Binds: {item.containers.length}</Badge>
              <Actions item={item} actions={images.actions} />
            </>
          }
        >
          <ListsFields
            data={[
              ["ID", item.id],
              ["Tags", item.tags.join(", ") || "-"],
              ["Size", humanBytes(item.size)],
              ["Created Time", humanDate(item.created)],
            ]}
          />
        </ListsItem>
      )}
    </Lists>
  );
};
