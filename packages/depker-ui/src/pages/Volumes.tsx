import React, { ChangeEvent } from "react";
import { ActionIcon, Button, Group, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { Main } from "../components/layout/Main";
import { TbApps, TbCircleDot, TbFiles, TbList, TbPlus, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { Async } from "../components/core/Async";
import { css } from "@emotion/react";
import { useCalling } from "../hooks/use-calling";
import { NavLink } from "../components/core/NavLink";
import { useNavigate } from "react-router-dom";
import { Empty } from "../components/core/Empty";
import { useVolumeBinds } from "../api/use-volume-binds";
import { useVolumes } from "../api/use-volumes";

const Binds: React.FC<{ volume: string }> = ({ volume }) => {
  const navigate = useNavigate();
  const binds = useVolumeBinds(volume);
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

const Actions: React.FC<{ volume: string; actions: ReturnType<typeof useVolumes>["actions"] }> = ({
  volume,
  actions,
}) => {
  const t = useMantineTheme();
  const navigate = useNavigate();
  const calling = useCalling();
  return (
    <>
      {volume.startsWith("@/") && (
        <Tooltip label="Files">
          <ActionIcon
            size="lg"
            color={t.primaryColor}
            loading={calling.loading}
            onClick={() => {
              navigate(`/files/fs/volumes/${volume.substring(2)}`);
            }}
          >
            <TbFiles />
          </ActionIcon>
        </Tooltip>
      )}
      <Tooltip label="Binds">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          loading={calling.loading}
          onClick={() => {
            openModal({
              title: `Volume ${volume} Binds`,
              children: <Binds volume={volume} />,
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
              title: "Delete Volume",
              children: (
                <>
                  <Text size="sm" color="red">
                    The volume mapping will not be removed immediately, need to re-deploy service.
                  </Text>
                  <Text size="sm">This action is irreversible. Confirm delete?</Text>
                </>
              ),
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (a) => {
                  try {
                    await actions.delete({ volume });
                    a.success(`Delete volume successful`, `All binds have been disconnected.`);
                  } catch (e: any) {
                    a.failure(`Delete volume failure`, e);
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

export const Volumes: React.FC = () => {
  const t = useMantineTheme();
  const volumes = useVolumes();
  return (
    <Main
      title="Ports"
      header={
        <Group>
          <Button
            leftIcon={<TbPlus />}
            onClick={() => {
              openModal({
                title: <>Create Volume</>,
                children: (
                  <ObjectModal
                    value={{}}
                    onChange={async (value, actions) => {
                      if (!value.volume) {
                        actions.failure(`Create volume failure`, `Volume must be not empty.`);
                        return false;
                      }
                      try {
                        await volumes.actions.create({ volume: value.volume });
                        actions.success(`Create volume successful`, `Volume need to bind to the service to use.`);
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create volume failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <TextInput
                        key="volume"
                        label="Host Volume"
                        description="The volume used by service storage."
                        placeholder="Host Volume Path"
                        icon={<TbCircleDot />}
                        value={item.volume}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, volume: e.target.value })}
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
      <Async query={volumes.query}>
        {volumes.data.map((item) => (
          <Group
            key={`volumes-${item}`}
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
              <Actions volume={item} actions={volumes.actions} />
            </Group>
          </Group>
        ))}
      </Async>
    </Main>
  );
};
