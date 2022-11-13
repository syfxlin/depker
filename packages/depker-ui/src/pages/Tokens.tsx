import React, { ChangeEvent } from "react";
import { Main } from "../components/layout/Main";
import { ActionIcon, Badge, Button, Group, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { TbApps, TbCheck, TbCopy, TbPlus, TbRefresh, TbTrash } from "react-icons/all";
import { useTokens } from "../api/use-tokens";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import { css } from "@emotion/react";
import { humanDate } from "../utils/human";
import { openConfirmModal, openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { showNotification } from "@mantine/notifications";
import { useClipboard } from "@mantine/hooks";
import { useCalling } from "../hooks/use-calling";

const Actions: React.FC<{ name: string; actions: ReturnType<typeof useTokens>["actions"] }> = ({ name, actions }) => {
  const t = useMantineTheme();
  const clipboard = useClipboard({ timeout: 500 });
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
                  message: (
                    <Stack spacing="xs">
                      <Text>Make sure to copy your personal access token now. You won’t be able to see it again!</Text>
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
                    a.success(`Delete token successful`, `The generated token has expired.`);
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
                        key="name"
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
            page={tokens.values.page}
            size={tokens.values.size}
            total={tokens.data.total}
            onChange={tokens.update.page}
          >
            {tokens.data.items.map((item) => (
              <Group
                key={`tokens-${item.name}`}
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
                  <Badge color="indigo">identity: {item.identity}</Badge>
                  <Actions name={item.name} actions={tokens.actions} />
                </Group>
              </Group>
            ))}
          </Pages>
        )}
      </Async>
    </Main>
  );
};
