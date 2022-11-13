import React, { ChangeEvent } from "react";
import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { Main } from "../components/layout/Main";
import { TbCertificate, TbCircleDot, TbList, TbPlus, TbSignature, TbTrash } from "react-icons/all";
import { openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import { css } from "@emotion/react";
import { humanDate } from "../utils/human";
import { usePorts } from "../api/use-ports";
import { useClipboard } from "@mantine/hooks";
import { useCalling } from "../hooks/use-calling";

const Actions: React.FC<{ name: string; binds: string[]; actions: ReturnType<typeof usePorts>["actions"] }> = ({
  name,
  actions,
}) => {
  const t = useMantineTheme();
  const clipboard = useClipboard({ timeout: 500 });
  const calling = useCalling();
  return (
    <>
      <Tooltip label="Binds">
        <ActionIcon size="lg" color={t.primaryColor} loading={calling.loading} onClick={() => {}}>
          <TbList />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete">
        <ActionIcon
          size="lg"
          color="red"
          loading={calling.loading}
          onClick={() => {
            // TODO: 必须要处于没有 bind 状态才可删除
            openConfirmModal({
              title: "Delete Port",
              children: (
                <>
                  <Text size="sm" color="red">
                    The port mapping will not be removed immediately, need to re-deploy application.
                  </Text>
                  <Text size="sm">This action is irreversible. Confirm delete?</Text>
                </>
              ),
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.delete({ name });
                    a.success(`Delete port successful`, `All binds have been disconnected.`);
                  } catch (e: any) {
                    a.failure(`Delete port failure`, e);
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

export const Ports: React.FC = () => {
  const t = useMantineTheme();
  const ports = usePorts();
  return (
    <Main
      title="Ports"
      header={
        <Group>
          <Button
            leftIcon={<TbPlus />}
            onClick={() => {
              openModal({
                title: <>Create Port</>,
                children: (
                  <ObjectModal
                    value={{}}
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
                        actions.success(`Create port successful`, `Port need to bind to the application to use.`);
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
            }}
          >
            Create
          </Button>
        </Group>
      }
    >
      <Async query={ports.query}>
        {ports.data && (
          <Pages
            page={ports.values.page}
            size={ports.values.size}
            total={ports.data.total}
            onChange={ports.update.page}
          >
            {ports.data.items.map((item) => (
              <Group
                key={`ports-${item.name}`}
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
                <Stack spacing={0}>
                  <Text weight={500}>{item.name}</Text>
                  <Text color="dimmed" size="xs">
                    Created on {humanDate(item.createdAt)}, Updated on {humanDate(item.updatedAt)}
                  </Text>
                </Stack>
                <Group spacing="xs">
                  <Actions name={item.name} binds={item.binds} actions={ports.actions} />
                </Group>
              </Group>
            ))}
          </Pages>
        )}
      </Async>
    </Main>
  );
};
