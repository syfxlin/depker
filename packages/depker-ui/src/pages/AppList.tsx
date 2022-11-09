import React, { ChangeEvent, useMemo } from "react";
import { Main } from "../components/layout/Main";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Input,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { TbApiApp, TbArrowUpRight, TbSearch, TbX } from "react-icons/all";
import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useApps } from "../api/use-apps";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import { colors } from "../api/use-status";
import { DateTime } from "luxon";
import { client } from "../api/client";

export const AppList: React.FC = () => {
  const t = useMantineTheme();
  const apps = useApps();

  const Search = useMemo(
    () => (
      <Input
        value={apps.values.search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => apps.update.search(e.target.value)}
        placeholder="Search apps"
        icon={<TbSearch />}
        rightSection={
          apps.values.search ? (
            <ActionIcon onClick={() => apps.update.search("")}>
              <TbX />
            </ActionIcon>
          ) : (
            <Text />
          )
        }
      />
    ),
    [apps.values.search]
  );

  const List = useMemo(
    () =>
      apps.data && (
        <Pages
          edges
          page={apps.values.page}
          size={apps.values.size}
          total={apps.data.total}
          onChange={apps.update.page}
        >
          <Grid>
            {apps.data?.items?.map((item) => (
              <Grid.Col key={`apps-${item.name}`} span={4}>
                <Card
                  withBorder
                  css={css`
                    padding: ${t.spacing.md}px ${t.spacing.lg}px;
                    border-radius: ${t.radius.sm}px;
                    overflow: visible;

                    &:hover {
                      background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
                    }
                  `}
                >
                  <Group>
                    <Avatar src={client.asset.icon(item.icon)}>
                      <TbApiApp />
                    </Avatar>
                    <Link
                      to={`/apps/${item.name}`}
                      css={css`
                        flex: 1;
                        text-decoration: none;
                        width: 100%;
                        overflow: hidden;

                        .mantine-Badge-root {
                          text-transform: none;
                          text-overflow: ellipsis;
                          max-width: 100%;
                        }
                      `}
                    >
                      <Text
                        css={css`
                          display: block;
                          color: ${t.fn.primaryColor()};
                          font-size: ${t.fontSizes.xl}px;
                          font-weight: 500;
                          text-decoration: none;
                          margin-bottom: ${t.spacing.xs * 0.5}px;
                        `}
                      >
                        {item.name}
                      </Text>
                      {item.buildpack && (
                        <Text size="xs" color="dimmed">
                          Buildpack: {item.buildpack}
                        </Text>
                      )}
                      <Text size="xs" color="dimmed">
                        Domain: {item.domain || "No configuration"}
                      </Text>
                      <Tooltip
                        label={
                          <Text
                            css={css`
                              font-size: ${t.fontSizes.xs}px;
                              font-family: ${t.fontFamilyMonospace};
                            `}
                          >
                            Deployd in {DateTime.fromMillis(item.deploydAt).toLocaleString(DateTime.DATETIME_SHORT)}
                            <br />
                            Created in {DateTime.fromMillis(item.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}
                            <br />
                            Updated in {DateTime.fromMillis(item.updatedAt).toLocaleString(DateTime.DATETIME_SHORT)}
                          </Text>
                        }
                      >
                        <Text size="xs" color="dimmed">
                          Uptime:{" "}
                          {item.deploydAt === 0
                            ? DateTime.fromMillis(item.deploydAt).toLocaleString(DateTime.DATETIME_SHORT)
                            : "No deployment"}
                        </Text>
                      </Tooltip>
                    </Link>
                    <Badge color={colors[item.status]}>{item.status}</Badge>
                    {item.domain && item.domain.length && (
                      <ActionIcon color={t.primaryColor} size="lg" onClick={() => window.open(`http://${item.domain}`)}>
                        <TbArrowUpRight />
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Pages>
      ),
    [apps.data, apps.values.page, apps.values.size, apps.values.sort]
  );

  return (
    <Main
      title="Apps"
      header={
        <Group>
          {Search}
          <Button>New App</Button>
        </Group>
      }
    >
      <Async query={apps.query}>{List}</Async>
    </Main>
  );
};
