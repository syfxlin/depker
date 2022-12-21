import React from "react";
import { colors } from "../../api/use-deploy-list";
import { Pages } from "../layout/Pages";
import { DateTime } from "luxon";
import { NavLink } from "../core/NavLink";
import { Badge, Grid, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { humanTimes } from "../../utils/human";
import { Async } from "../core/Async";
import { TimeRefresh } from "../core/TimeRefresh";
import { useCronList } from "../../api/use-cron-list";

export type CronListProps = {
  service: string;
};

export const CronList: React.FC<CronListProps> = ({ service }) => {
  const t = useMantineTheme();
  const crons = useCronList(service);

  return (
    <Async query={crons.query}>
      {crons.data && (
        <Pages
          siblings={0}
          page={crons.values.page}
          size={crons.values.size}
          total={crons.data.total}
          onChange={crons.update.page}
        >
          {crons.data?.items?.map((cron) => {
            const createdAt = DateTime.fromMillis(cron.createdAt);
            const updatedAt = DateTime.fromMillis(cron.updatedAt);
            return (
              <NavLink
                key={`cron-${cron.id}`}
                action={`/services/${service}/crons/${cron.id}`}
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
                        <Tooltip label={cron.cron}>
                          <Text size="md" weight={500} inline>
                            {cron.cron}
                          </Text>
                        </Tooltip>
                        <Badge color={colors[cron.status]} size="sm">
                          {cron.status}
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
                        {["queued", "running"].includes(cron.status) && (
                          <Tooltip label={`Created in ${createdAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                            <Text size="lg" weight={500} inline>
                              <TimeRefresh interval={5000}>
                                {() => humanTimes(DateTime.utc().diff(createdAt).get("milliseconds"))}
                              </TimeRefresh>
                            </Text>
                          </Tooltip>
                        )}
                        {!["queued", "running"].includes(cron.status) && (
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
