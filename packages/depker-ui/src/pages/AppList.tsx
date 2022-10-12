import React, { ChangeEvent } from "react";
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
import { day } from "../utils/day";
import { Pages } from "../components/layout/Pages";
import { colors, useStatus } from "../api/use-status";

export const AppList: React.FC = () => {
  const t = useMantineTheme();
  const query = useApps();
  const status = useStatus(query.data?.items?.map((i) => i.name) ?? []);
  return (
    <Main
      title="Apps"
      header={
        <Group>
          <Input
            value={query.search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => query.setSearch(e.target.value)}
            placeholder="Search apps"
            icon={<TbSearch />}
            rightSection={
              query.search ? (
                <ActionIcon onClick={() => query.setSearch("")}>
                  <TbX />
                </ActionIcon>
              ) : (
                <Text />
              )
            }
          />
          <Button>New App</Button>
        </Group>
      }
    >
      <Async query={query}>
        {query.data && (
          <Pages page={query.page} size={query.size} total={query.data.total} onChange={query.setPage}>
            <Grid>
              {query.data?.items?.map((item) => (
                <Grid.Col key={`apps-${item.name}`} span={4}>
                  <Card
                    withBorder
                    css={css`
                      padding: ${t.spacing.md}px ${t.spacing.lg}px;
                      border-radius: ${t.radius.sm}px;
                      overflow: visible;
                    `}
                  >
                    <Group>
                      <Avatar src={`http://localhost:3000${item.buildpack.icon}`}>
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
                        <Text size="xs" color="dimmed">
                          Buildpack: {item.buildpack.label ?? item.buildpack.name}
                          {item.buildpack.group ? " / " + item.buildpack.group : ""}
                        </Text>
                        {item.domain && item.domain.length && (
                          <Text size="xs" color="dimmed">
                            Domain: {item.domain.join(", ")}
                          </Text>
                        )}
                        <Tooltip
                          label={
                            <Text
                              css={css`
                                font-size: ${t.fontSizes.xs}px;
                                font-family: ${t.fontFamilyMonospace};
                              `}
                            >
                              Deployd At: {day(item.deploydAt).format("YYYY-MM-DD HH:mm")}
                              <br />
                              Created At: {day(item.createdAt).format("YYYY-MM-DD HH:mm")}
                              <br />
                              Updated At: {day(item.updatedAt).format("YYYY-MM-DD HH:mm")}
                            </Text>
                          }
                          withArrow
                          transition="pop"
                          transitionDuration={300}
                          zIndex={1998}
                        >
                          <Text size="xs" color="dimmed">
                            Uptime: {day(item.deploydAt).format("YYYY-MM-DD HH:mm")}
                          </Text>
                        </Tooltip>
                      </Link>
                      <Badge color={colors[status.get(item.name) ?? "stopped"]}>
                        {status.get(item.name) ?? "stopped"}
                      </Badge>
                      {item.domain && item.domain.length && (
                        <ActionIcon
                          color={t.primaryColor}
                          size="lg"
                          onClick={() => window.open(`http://${item.domain[0]}`)}
                        >
                          <TbArrowUpRight />
                        </ActionIcon>
                      )}
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Pages>
        )}
      </Async>
    </Main>
  );
};
