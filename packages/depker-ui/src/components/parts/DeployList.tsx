import React from "react";
import { colors, useDeployList } from "../../api/use-deploy-list";
import { Pages } from "../layout/Pages";
import { DateTime } from "luxon";
import { NavLink } from "../core/NavLink";
import { Badge, Grid, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { humanTimes } from "../../utils/human";
import { Async } from "../core/Async";
import { TimeRefresh } from "../core/TimeRefresh";

export type DeployListProps = {
  app: string;
};

export const DeployList: React.FC<DeployListProps> = ({ app }) => {
  const t = useMantineTheme();
  const deploys = useDeployList(app);

  return (
    <Async query={deploys.query}>
      {deploys.data && (
        <Pages
          siblings={0}
          page={deploys.values.page}
          size={deploys.values.size}
          total={deploys.data.total}
          onChange={deploys.update.page}
        >
          {deploys.data?.items?.map((deploy) => {
            const createdAt = DateTime.fromMillis(deploy.createdAt);
            const updatedAt = DateTime.fromMillis(deploy.updatedAt);
            return (
              <NavLink
                key={`deploy-${deploy.id}`}
                action={`/apps/${app}/deploys/${deploy.id}`}
                label={
                  <Grid p={t.spacing.xs * 0.5}>
                    <Grid.Col
                      span={4}
                      css={css`
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        vertical-align: middle;
                      `}
                    >
                      <Stack spacing={t.spacing.xs * 0.5}>
                        <Tooltip label={deploy.commit}>
                          <Text size="md" weight={500} inline>
                            {deploy.commit.substring(0, 7)}
                          </Text>
                        </Tooltip>
                        <Text size="xs" inline>
                          {deploy.trigger}
                        </Text>
                        <Badge color={colors[deploy.status]} size="sm">
                          {deploy.status}
                        </Badge>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col
                      span={8}
                      css={css`
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        vertical-align: middle;
                      `}
                    >
                      <Stack spacing={t.spacing.xs * 0.5}>
                        {["queued", "running"].includes(deploy.status) && (
                          <Tooltip label={`Created in ${createdAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                            <Text size="lg" weight={500} inline>
                              <TimeRefresh interval={5000}>
                                {() => humanTimes(DateTime.utc().diff(createdAt).get("milliseconds"))}
                              </TimeRefresh>
                            </Text>
                          </Tooltip>
                        )}
                        {!["queued", "running"].includes(deploy.status) && (
                          <>
                            <Tooltip label={`Created in ${createdAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                              <Text size="md" weight={500}>
                                <TimeRefresh interval={5000}>
                                  {() => `${humanTimes(DateTime.utc().diff(createdAt).get("milliseconds"))} ago`}
                                </TimeRefresh>
                              </Text>
                            </Tooltip>
                            <Tooltip label={`Finished in ${updatedAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                              <Text size="xs" inline>
                                <TimeRefresh interval={5000}>
                                  {() => `Finished in ${humanTimes(updatedAt.diff(createdAt).get("milliseconds"))}`}
                                </TimeRefresh>
                              </Text>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Grid.Col>
                  </Grid>
                }
              />
            );
          })}
        </Pages>
      )}
    </Async>
  );
};
