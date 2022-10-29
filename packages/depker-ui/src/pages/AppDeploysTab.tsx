import React, { useMemo } from "react";
import { Badge, Grid, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { NavLink } from "../components/core/NavLink";
import { css } from "@emotion/react";
import { humanLongTime } from "../utils/human";
import { Logs as LogView } from "../components/core/Logs";
import { colors, useDeployList } from "../api/use-deploy-list";
import { DateTime } from "luxon";
import { Async } from "../components/core/Async";
import { useDeployLogs } from "../api/use-deploy-logs";
import { Pages } from "../components/layout/Pages";

export const AppDeploysTab: React.FC = () => {
  const t = useMantineTheme();
  const { app, deploy } = useParams<"app" | "deploy">();
  const logs = useDeployLogs(deploy!);
  const deploys = useDeployList(app!);

  const Logs = useMemo(
    () => (
      <LogView title="Deploy Logs" empty={deploy ? "Loading..." : "Select a deploy to see the logs."} data={logs} />
    ),
    [logs]
  );

  const Deploys = useMemo(() => {
    return (
      <Async query={deploys}>
        {deploys.data && (
          <Pages
            siblings={0}
            page={deploys.page}
            size={deploys.size}
            total={deploys.data.total}
            onChange={deploys.setPage}
          >
            {deploys.data?.items?.map((deploy) => {
              const createdAt = DateTime.fromMillis(deploy.createdAt);
              const updatedAt = DateTime.fromMillis(deploy.updatedAt);
              return (
                <NavLink
                  key={`deploy-${deploy.id}`}
                  action={`/apps/depker/deploys/${deploy.id}`}
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
                                {humanLongTime(DateTime.utc().diff(createdAt).get("milliseconds"))}
                              </Text>
                            </Tooltip>
                          )}
                          {!["queued", "running"].includes(deploy.status) && (
                            <>
                              <Tooltip label={`Created in ${createdAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                                <Text size="md" weight={500}>
                                  {humanLongTime(DateTime.utc().diff(createdAt).get("milliseconds"))} ago
                                </Text>
                              </Tooltip>
                              <Tooltip label={`Finished in ${updatedAt.toLocaleString(DateTime.DATETIME_SHORT)}`}>
                                <Text size="xs" inline>
                                  Finished in {humanLongTime(updatedAt.diff(createdAt).get("milliseconds"))}
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
  }, [deploys.data, deploys.error, deploys.mutate]);

  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Deploy Logs</Heading>
      <Grid
        css={css`
          flex: 1;

          .mantine-Col-root {
            display: flex;
            flex-direction: column;
            flex: 1;
          }
        `}
      >
        <Grid.Col span={8}>{Logs}</Grid.Col>
        <Grid.Col span={4}>{Deploys}</Grid.Col>
      </Grid>
    </Stack>
  );
};
