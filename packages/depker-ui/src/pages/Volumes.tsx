import React, { ChangeEvent } from "react";
import { ActionIcon, Button, Group, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { Main } from "../components/layout/Main";
import { TbApps, TbCircleDot, TbFiles, TbPlus, TbTrash } from "react-icons/all";
import { closeAllModals, openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { Async } from "../components/core/Async";
import { useCalling } from "../hooks/use-calling";
import { NavLink } from "../components/core/NavLink";
import { useNavigate } from "react-router-dom";
import { Empty } from "../components/core/Empty";
import { useVolumeBinds } from "../api/use-volume-binds";
import { useVolumes } from "../api/use-volumes";
import { ListsItem } from "../components/layout/Lists";
import { css } from "@emotion/react";

const Binds: React.FC<{ volume: string }> = ({ volume }) => {
  const t = useMantineTheme();
  const navigate = useNavigate();
  const binds = useVolumeBinds(volume);
  return (
    <Stack spacing="xs">
      <Async query={binds.query}>
        {binds.data.map((item) => (
          <NavLink
            key={`volume:${volume}:bind:${item}`}
            active
            label={item}
            icon={<TbApps />}
            action={() => {
              closeAllModals();
              navigate(`/services/${item}/`);
            }}
            css={css`
              border-radius: ${t.radius.sm}px;
            `}
          />
        ))}
        {!binds.data.length && <Empty />}
      </Async>
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
                    a.success(`Delete volume successful`, `The volume has been successfully deleted.`);
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
                    button="Create"
                    value={{}}
                    onChange={async (value, actions) => {
                      if (!value.volume) {
                        actions.failure(`Create volume failure`, `Volume must be not empty.`);
                        return false;
                      }
                      try {
                        await volumes.actions.create({ volume: value.volume });
                        actions.success(`Create volume successful`, `The service has been successfully created.`);
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create volume failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <TextInput
                        key="input:volume"
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
          <ListsItem
            key={`volume:${item}`}
            left={<Text weight={500}>{item}</Text>}
            right={<Actions volume={item} actions={volumes.actions} />}
          >
            <Binds volume={item} />
          </ListsItem>
        ))}
      </Async>
    </Main>
  );
};
