import React from "react";
import { ActionIcon, Button, Group, NumberInput, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { Main } from "../components/layout/Main";
import { TbApps, TbCircleDot, TbList, TbPlus, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { Async } from "../components/core/Async";
import { css } from "@emotion/react";
import { usePorts } from "../api/use-ports";
import { useCalling } from "../hooks/use-calling";
import { usePortBinds } from "../api/use-port-binds";
import { NavLink } from "../components/core/NavLink";
import { useNavigate } from "react-router-dom";
import { Empty } from "../components/core/Empty";

const Binds: React.FC<{ port: number }> = ({ port }) => {
  const navigate = useNavigate();
  const binds = usePortBinds(port);
  return (
    <Stack spacing="xs">
      {binds.data.map((item) => (
        <NavLink
          key={`binds-${item}`}
          label={item}
          icon={<TbApps />}
          action={() => {
            closeAllModals();
            navigate(`/services/${item}/`);
          }}
        />
      ))}
      {!binds.data.length && <Empty />}
    </Stack>
  );
};

const Actions: React.FC<{ port: number; actions: ReturnType<typeof usePorts>["actions"] }> = ({ port, actions }) => {
  const t = useMantineTheme();
  const calling = useCalling();
  return (
    <>
      <Tooltip label="Binds">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          loading={calling.loading}
          onClick={() => {
            openModal({
              title: `Port ${port} Binds`,
              children: <Binds port={port} />,
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
            openConfirmModal({
              title: "Delete Port",
              children: (
                <>
                  <Text size="sm" color="red">
                    The port mapping will not be removed immediately, need to re-deploy service.
                  </Text>
                  <Text size="sm">This action is irreversible. Confirm delete?</Text>
                </>
              ),
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.delete({ port });
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
                      if (!value.port) {
                        actions.failure(`Create port failure`, `Port must be not empty.`);
                        return false;
                      }
                      try {
                        await ports.actions.create({ port: value.port });
                        actions.success(`Create port successful`, `Port need to bind to the service to use.`);
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create port failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <NumberInput
                        key="port"
                        label="Host Port"
                        description="The port used by host port proxy."
                        placeholder="Host Port Number"
                        min={1}
                        max={65535}
                        icon={<TbCircleDot />}
                        value={item.port}
                        onChange={(value) => setItem({ ...item, port: value })}
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
        {ports.data.map((item) => (
          <Group
            key={`ports-${item}`}
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
              <Text weight={500}>{item}</Text>
            </Stack>
            <Group spacing="xs">
              <Actions port={item} actions={ports.actions} />
            </Group>
          </Group>
        ))}
      </Async>
    </Main>
  );
};
