import React from "react";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { ActionIcon, Badge, Group, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useAppHistory } from "../api/use-app-history";
import { Pages } from "../components/layout/Pages";
import { Async } from "../components/core/Async";
import { DateTime } from "luxon";
import { TbCheck, TbCopy } from "react-icons/all";
import { useClipboard } from "@mantine/hooks";

const Copy: React.FC<{ commit: string }> = ({ commit }) => {
  const t = useMantineTheme();
  const clipboard = useClipboard({ timeout: 500 });
  return (
    <Tooltip label={clipboard.copied ? "Copied!" : "Copy the full SHA"}>
      <ActionIcon size="lg" color={t.primaryColor} onClick={() => clipboard.copy(commit)}>
        {clipboard.copied ? <TbCheck /> : <TbCopy />}
      </ActionIcon>
    </Tooltip>
  );
};

export const AppHistoryTab: React.FC = () => {
  const t = useMantineTheme();
  const { app } = useParams<"app">();
  const history = useAppHistory(app!);

  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Application History</Heading>
      <Async query={history.query}>
        {history.data && (
          <Pages
            page={history.values.page}
            size={history.values.size}
            total={history.data.total}
            onChange={history.update.page}
          >
            <Stack spacing="xs">
              {history.data.items.map((item) => (
                <Group
                  key={`history-${item.commit}`}
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
                    <Tooltip label={item.body} hidden={!item.body}>
                      <Text weight={500}>{item.message}</Text>
                    </Tooltip>
                    <Text color="dimmed" size="xs">
                      <Tooltip label={`${item.author} <${item.email}>`}>
                        <span>{item.author}</span>
                      </Tooltip>
                      <span> committed on </span>
                      <span>{DateTime.fromMillis(item.time).toLocaleString(DateTime.DATETIME_SHORT)}</span>
                    </Text>
                  </Stack>
                  <Group spacing="xs">
                    {item.refs.map((ref) => (
                      <Badge key={`history-ref-${ref}`} color={ref.startsWith("tag:") ? "cyan" : "green"}>
                        {ref}
                      </Badge>
                    ))}
                    <Tooltip label={item.commit}>
                      <Badge key={`history-commit-${item.commit}`} color="indigo">
                        sha: {item.commit.substring(0, 7)}
                      </Badge>
                    </Tooltip>
                    <Copy commit={item.commit} />
                  </Group>
                </Group>
              ))}
            </Stack>
          </Pages>
        )}
      </Async>
    </Stack>
  );
};
