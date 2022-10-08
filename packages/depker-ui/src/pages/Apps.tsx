import React from "react";
import { Main } from "../components/Main";
import { ActionIcon, Avatar, Badge, Card, Grid, Group, Text, TextInput, Tooltip } from "@mantine/core";
import { IconApiApp, IconArrowUpRight } from "@tabler/icons";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { Link } from "react-router-dom";
import { useApps } from "../api/use-apps";
import { Async } from "../components/Async";
import { day } from "../utils/day";

export const Apps: React.FC = () => {
  const { u } = useU();
  const query = useApps();
  return (
    <Main
      title="Apps"
      header={
        <>
          <TextInput />
        </>
      }
    >
      <Async query={query}>
        <Grid>
          {query.data?.items?.map((item) => (
            <Grid.Col key={`apps-${item.name}`} span={4}>
              <Card
                withBorder
                css={css`
                  padding: ${u.sp(4)} ${u.sp(5)};
                  border-radius: ${u.br(2)};
                  overflow: visible;
                `}
              >
                <Group>
                  <Avatar src={`http://localhost:3000${item.icon}`}>
                    <IconApiApp />
                  </Avatar>
                  <Link
                    to={`/apps/${item.name}`}
                    css={css`
                      flex: 1;
                      text-decoration: none;
                    `}
                  >
                    <Text
                      css={css`
                        display: block;
                        color: ${u.c("primary7", "primary3")};
                        font-size: ${u.fs("xl")};
                        font-weight: 500;
                        text-decoration: none;
                        margin-bottom: ${u.sp(1)};
                      `}
                    >
                      {item.name}
                    </Text>
                    <Text
                      color="dimmed"
                      css={css`
                        font-size: ${u.fs("xs")};
                        width: max-content;
                      `}
                    >
                      Buildpack: {item.buildpack}
                    </Text>
                    {item.domain && item.domain.length && (
                      <Text
                        color="dimmed"
                        css={css`
                          font-size: ${u.fs("xs")};
                          width: max-content;
                        `}
                      >
                        Domain: {item.domain.join(", ")}
                      </Text>
                    )}
                    <Tooltip
                      label={
                        <Text
                          css={css`
                            font-size: ${u.fs("xs")};
                            font-family: ${u.f("mono")};
                          `}
                        >
                          Deployd At: {day(item.deploydAt).format("YYYY-MM-DD HH:mm")}
                          <br />
                          Created At: {day(item.createdAt).format("YYYY-MM-DD HH:mm")}
                          <br />
                          Updated At: {day(item.updatedAt).format("YYYY-MM-DD HH:mm")}
                        </Text>
                      }
                      withArrow={true}
                      transition="pop"
                      transitionDuration={300}
                      zIndex={1998}
                    >
                      <Text
                        color="dimmed"
                        css={css`
                          font-size: ${u.fs("xs")};
                          width: max-content;
                        `}
                      >
                        Uptime: {day(item.deploydAt).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </Tooltip>
                  </Link>
                  <Badge color="green">{(query.status[item.name] ?? "stopped").toUpperCase()}</Badge>
                  {item.domain && item.domain.length && (
                    <ActionIcon color="green" size="lg" onClick={() => window.open(`http://${item.domain[0]}`)}>
                      <IconArrowUpRight />
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Async>
    </Main>
  );
};
