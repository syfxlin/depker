import React, { ChangeEvent } from "react";
import { Main } from "../components/layout/Main";
import { ActionIcon, Badge, Button, Group, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { TbApps, TbCheck, TbCopy, TbPlus, TbRefresh, TbTrash } from "react-icons/all";
import { useTokens } from "../api/use-tokens";
import { humanDate } from "../utils/human";
import { openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { showNotification } from "@mantine/notifications";
import { useClipboard } from "@mantine/hooks";
import { useCalling } from "../hooks/use-calling";
import { ListsItem } from "../components/layout/Lists";
import { Pages } from "../components/layout/Pages";
import { Async } from "../components/core/Async";

const Copy: React.FC<{ token: string }> = ({ token }) => {
  const t = useMantineTheme();
  const clipboard = useClipboard({ timeout: 500 });
  return (
    <Stack spacing="xs">
      <Text>Make sure to copy your personal access token now. You won’t be able to see it again!</Text>
      <Group spacing="xs" noWrap>
        <Text size="xs" color={t.primaryColor}>
          {token}
        </Text>
        <Tooltip label={clipboard.copied ? "Copied!" : "Copy"}>
          <ActionIcon color={t.primaryColor} onClick={() => clipboard.copy(token)}>
            {clipboard.copied ? <TbCheck /> : <TbCopy />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
  );
};

const Actions: React.FC<{ name: string; actions: ReturnType<typeof useTokens>["actions"] }> = ({ name, actions }) => {
  const t = useMantineTheme();
  const calling = useCalling();
  return (
    <>
      <Tooltip label="Re-create">
        <ActionIcon
          size="lg"
          color={t.primaryColor}
          loading={calling.loading}
          onClick={() => {
            calling.calling(async (a) => {
              try {
                const result = await actions.update({ name });
                showNotification({
                  autoClose: false,
                  title: `Re-create token successful`,
                  message: <Copy token={result.token} />,
                });
              } catch (e: any) {
                a.failure(`Re-create token failure`, e);
              }
            });
          }}
        >
          <TbRefresh />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete">
        <ActionIcon
          size="lg"
          color="red"
          loading={calling.loading}
          onClick={() => {
            openConfirmModal({
              title: "Delete Token",
              children: (
                <>
                  <Text size="sm" color="red">
                    Programs using this token will no longer be able to access.
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
                    a.success(`Delete token successful`, `The token has been successfully deleted.`);
                  } catch (e: any) {
                    a.failure(`Delete token failure`, e);
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

export const Tokens: React.FC = () => {
  const t = useMantineTheme();
  const clipboard = useClipboard({ timeout: 500 });
  const tokens = useTokens();
  return (
    <Main
      title="Tokens"
      header={
        <Group>
          <Button
            leftIcon={<TbPlus />}
            onClick={() => {
              openModal({
                title: <>Create Token</>,
                children: (
                  <ObjectModal
                    button="Create"
                    value={{}}
                    onChange={async (value, actions) => {
                      if (!value.name) {
                        actions.failure(`Create token failure`, `Name must be not empty.`);
                        return false;
                      }
                      try {
                        const result = await tokens.actions.create({ name: value.name });
                        showNotification({
                          autoClose: false,
                          title: `Create token successful`,
                          message: (
                            <Stack spacing="xs">
                              <Text>
                                Make sure to copy your personal access token now. You won’t be able to see it again!
                              </Text>
                              <Group spacing="xs" noWrap>
                                <Text size="xs" color={t.primaryColor}>
                                  {result.token}
                                </Text>
                                <Tooltip label={clipboard.copied ? "Copied!" : "Copy"}>
                                  <ActionIcon color={t.primaryColor} onClick={() => clipboard.copy(result.token)}>
                                    {clipboard.copied ? <TbCheck /> : <TbCopy />}
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Stack>
                          ),
                        });
                        return true;
                      } catch (e: any) {
                        actions.failure(`Create token failure`, e);
                        return false;
                      }
                    }}
                  >
                    {(item, setItem) => [
                      <TextInput
                        key="input:name"
                        required
                        label="Name"
                        description="Token name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                        placeholder="Token Name"
                        icon={<TbApps />}
                        value={item.name ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
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
      <Async query={tokens.query}>
        {tokens.data && (
          <Pages
            edges
            page={tokens.values.page}
            size={tokens.values.size}
            total={tokens.data?.total ?? 0}
            onChange={tokens.update.page}
          >
            {tokens.data.items.map((item) => (
              <ListsItem
                key={`token:${item.name}`}
                left={
                  <Stack spacing={0}>
                    <Text weight={500}>{item.name}</Text>
                    <Text color="dimmed" size="xs">
                      Created on {humanDate(item.createdAt)}, Updated on {humanDate(item.updatedAt)}
                    </Text>
                  </Stack>
                }
                right={
                  <>
                    <Badge color="indigo">identity: {item.identity}</Badge>
                    <Actions name={item.name} actions={tokens.actions} />
                  </>
                }
              />
            ))}
          </Pages>
        )}
      </Async>
    </Main>
  );
};
