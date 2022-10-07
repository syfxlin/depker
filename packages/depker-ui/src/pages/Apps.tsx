import React from "react";
import { Main } from "../components/Main";
import { ActionIcon, Avatar, Badge, Card, Grid, Group, Text, TextInput, Tooltip } from "@mantine/core";
import { IconApiApp, IconArrowUpRight } from "@tabler/icons";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { Link } from "react-router-dom";
import { useApps } from "../api/use-apps";

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
      <Grid>
        <Grid.Col span={4}>
          <Card
            withBorder
            css={css`
              padding: ${u.sp(4)} ${u.sp(5)};
              border-radius: ${u.br(2)};
              overflow: visible;
            `}
          >
            <Group>
              <Avatar src="http://localhost:3000/api/assets/icons/nodedotjs">
                <IconApiApp />
              </Avatar>
              <Link
                to={"/apps/depker"}
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
                  `}
                >
                  depker
                </Text>
                <Tooltip
                  label={
                    <Text
                      css={css`
                        font-size: ${u.fs("xs")};
                        font-family: ${u.f("mono")};
                      `}
                    >
                      Domain: depker.ixk.me
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
                    Domain: depker.ixk.me
                  </Text>
                </Tooltip>
                <Tooltip
                  label={
                    <Text
                      css={css`
                        font-size: ${u.fs("xs")};
                        font-family: ${u.f("mono")};
                      `}
                    >
                      Deployd At: YYYY-MM-DD HH:mm
                      <br />
                      Created At: YYYY-MM-DD HH:mm
                      <br />
                      Updated At: YYYY-MM-DD HH:mm
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
                    Deployd At: MM-DD HH:mm
                  </Text>
                </Tooltip>
              </Link>
              <Badge color="green">RUNNING</Badge>
              <ActionIcon color="green" size="lg" onClick={() => window.open("http://depker.ixk.me")}>
                <IconArrowUpRight />
              </ActionIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Main>
  );
};
