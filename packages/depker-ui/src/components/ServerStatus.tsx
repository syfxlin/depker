import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { CardStats, PercStats, TextStats } from "./Stats";
import {
  IconActivity,
  IconArchive,
  IconCalendarStats,
  IconClock,
  IconCpu2,
  IconDatabase,
  IconDatabaseExport,
} from "@tabler/icons";
import { GB, HOUR } from "../utils/constant";
import { Grid, List, LoadingOverlay, Text, Tooltip } from "@mantine/core";
import { css } from "@emotion/react";
import { day } from "../utils/day";
import { useU } from "@syfxlin/ustyled";
import { client } from "../api/client";

export const ServerStatus: React.FC = () => {
  const { u } = useU();
  const [disk, setDisk] = useState(0);
  const response = useSWR("/api/infos/metrics", () => client.info.metrics(), { refreshInterval: 5000 });

  const time = useMemo(
    () => response.data?.time ?? { current: day().valueOf(), timezone: day.tz?.guess(), uptime: 0 },
    [response.data?.time]
  );

  const cpu = useMemo(() => response.data?.cpu ?? { used: 0, total: 1 }, [response.data?.cpu]);
  const memory = useMemo(() => response.data?.memory ?? { used: 0, total: 1 }, [response.data?.memory]);
  const swap = useMemo(() => response.data?.swap ?? { used: 0, total: 1 }, [response.data?.swap]);

  const disks = useMemo(() => {
    const items = response.data?.disk ?? [{ name: "U", type: "Unknown", used: 0, total: 1 }];
    return items[disk % items.length];
  }, [disk, response.data?.disk]);

  const requests = useMemo(() => {
    const items = Object.entries(response.data?.traefik?.requests ?? {}) as [string, number][];
    const success = items.filter(([c]) => parseInt(c) < 400);
    const failure4 = items.filter(([c]) => parseInt(c) >= 400 && parseInt(c) < 500);
    const failure5 = items.filter(([c]) => parseInt(c) >= 500);
    return { success, failure4, failure5 };
  }, [response.data?.traefik?.requests]);

  const certs = useMemo(() => {
    const now = day();
    const items = Object.entries(response.data?.traefik?.certs ?? {}) as [string, number][];
    const expired = items.filter(([, i]) => day(i).isBefore(now));
    const expiring = items.filter(([, i]) => day(i).isAfter(now) && day(i).subtract(30, "days").isBefore(now));
    const normal = items.filter(([, i]) => day(i).subtract(30, "days").isAfter(now));
    return { expired, expiring, normal };
  }, [response.data?.traefik?.certs]);

  const connections = useMemo(() => {
    const items = Object.entries(response.data?.traefik?.connections ?? {}) as [string, number][];
    return items
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([n, c]) => ({ name: n.toUpperCase(), value: c }));
  }, [response.data?.traefik?.connections]);

  const reload = useMemo(() => {
    return (
      response.data?.traefik?.reload ?? {
        last_success: day().valueOf(),
        last_failure: 0,
        total_success: 0,
        total_failure: 0,
      }
    );
  }, [response.data?.traefik?.reload]);

  return (
    <Grid
      css={css`
        position: relative;
      `}
    >
      <LoadingOverlay visible={!response.error && !response.data} overlayBlur={4} />
      <Grid.Col span={12} md={4}>
        <TextStats title="Server Uptime" icon={IconActivity} value={(time.uptime / HOUR).toFixed(2) + "H"} />
      </Grid.Col>
      <Grid.Col span={12} md={4}>
        <TextStats title="Server Time" icon={IconClock} value={day(time.current).format("YYYY-MM-DD HH:mm")} />
      </Grid.Col>
      <Grid.Col span={12} md={4}>
        <TextStats title="Server TimeZone" icon={IconCalendarStats} value={time.timezone} />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats title="CPU" icon={IconCpu2} value={(cpu.used / cpu.total) * 100} />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats
          title="Memory"
          icon={IconDatabase}
          value={{
            used: memory.used / GB,
            total: memory.total / GB,
            unit: "GB",
          }}
        />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats
          title="Swap"
          icon={IconDatabaseExport}
          value={{
            used: swap.used / GB,
            total: swap.total / GB,
            unit: "GB",
          }}
        />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats
          title={
            <Tooltip label="点击切换其他磁盘" withArrow={true} transition="pop" transitionDuration={300} zIndex={998}>
              <Text
                onClick={() => setDisk((v) => v + 1)}
                css={css`
                  cursor: pointer;
                  user-select: none;
                `}
              >
                Disk {disks.name} ({disks.type})
              </Text>
            </Tooltip>
          }
          icon={IconArchive}
          value={{
            used: disks.used / GB,
            total: disks.total / GB,
            unit: "GB",
          }}
        />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Requests"
          value={[
            {
              name: "成功请求",
              value: requests.success.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.success.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {requests.success.map(([i, c]) => (
                    <List.Item key={`request-success-${i}`}>
                      Code {i}: {c}
                    </List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "失败请求（4xx）",
              value: requests.failure4.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.failure4.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {requests.failure4.map(([i, c]) => (
                    <List.Item key={`request-failure4-${i}`}>
                      Code {i}: {c}
                    </List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "失败请求（5xx）",
              value: requests.failure5.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.failure5.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {requests.failure5.map(([i, c]) => (
                    <List.Item key={`request-failure5-${i}`}>
                      Code {i}: {c}
                    </List.Item>
                  ))}
                </List>
              ),
            },
          ]}
        />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Certificates"
          value={[
            {
              name: "即将过期",
              value: certs.expiring.length,
              tooltip: certs.expiring.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {certs.expiring.map(([i]) => (
                    <List.Item key={`cert-expiring-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "已经过期",
              value: certs.expired.length,
              tooltip: certs.expired.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {certs.expired.map(([i]) => (
                    <List.Item key={`cert-expired-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "暂未过期",
              value: certs.normal.length,
              tooltip: certs.normal.length && (
                <List
                  css={css`
                    color: ${u.c("white")};
                    font-size: ${u.fs("xs")};
                  `}
                >
                  {certs.normal.map(([i]) => (
                    <List.Item key={`cert-normal-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
          ]}
        />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <CardStats title="Connections (Top 3)" value={connections} />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Traefik Reloads"
          value={[
            {
              name: "重载失败",
              value: reload.total_failure,
              tooltip: `上次重载时间：${day(reload.last_failure).format("YYYY-MM-DD HH:mm")}`,
            },
            {
              name: "重载成功",
              value: reload.total_success,
              tooltip: `上次重载时间：${day(reload.last_success).format("YYYY-MM-DD HH:mm")}`,
            },
          ]}
        />
      </Grid.Col>
    </Grid>
  );
};
