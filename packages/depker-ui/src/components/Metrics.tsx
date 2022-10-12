import React, { useMemo, useState } from "react";
import { CardStats, PercStats, TextStats } from "./core/Stats";
import { GB, HOUR } from "../utils/constant";
import { Grid, List, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { day } from "../utils/day";
import { useMetrics } from "../api/use-metrics";
import { TbActivity, TbArchive, TbCalendarStats, TbClock, TbCpu2, TbDatabase, TbDatabaseExport } from "react-icons/all";

export const Metrics: React.FC = () => {
  const t = useMantineTheme();
  const [disk, setDisk] = useState(0);
  const query = useMetrics();

  const time = useMemo(
    () => query.data?.time ?? { current: day().valueOf(), timezone: day.tz?.guess(), uptime: 0 },
    [query.data?.time]
  );

  const cpu = useMemo(() => query.data?.cpu ?? { used: 0, total: 1 }, [query.data?.cpu]);
  const memory = useMemo(() => query.data?.memory ?? { used: 0, total: 1 }, [query.data?.memory]);
  const swap = useMemo(() => query.data?.swap ?? { used: 0, total: 1 }, [query.data?.swap]);

  const disks = useMemo(() => {
    const items = query.data?.disk ?? [{ name: "U", type: "Unknown", used: 0, total: 1 }];
    return items[disk % items.length];
  }, [disk, query.data?.disk]);

  const requests = useMemo(() => {
    const items = Object.entries(query.data?.traefik?.requests ?? {}) as [string, number][];
    const success = items.filter(([c]) => parseInt(c) < 400);
    const failure4 = items.filter(([c]) => parseInt(c) >= 400 && parseInt(c) < 500);
    const failure5 = items.filter(([c]) => parseInt(c) >= 500);
    return { success, failure4, failure5 };
  }, [query.data?.traefik?.requests]);

  const certs = useMemo(() => {
    const now = day();
    const items = Object.entries(query.data?.traefik?.certs ?? {}) as [string, number][];
    const expired = items.filter(([, i]) => day(i).isBefore(now));
    const expiring = items.filter(([, i]) => day(i).isAfter(now) && day(i).subtract(30, "days").isBefore(now));
    const normal = items.filter(([, i]) => day(i).subtract(30, "days").isAfter(now));
    return { expired, expiring, normal };
  }, [query.data?.traefik?.certs]);

  const connections = useMemo(() => {
    const items = Object.entries(query.data?.traefik?.connections ?? {}) as [string, number][];
    return items
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([n, c]) => ({ name: n.toUpperCase(), value: c }));
  }, [query.data?.traefik?.connections]);

  const reload = useMemo(() => {
    return (
      query.data?.traefik?.reload ?? {
        last_success: day().valueOf(),
        last_failure: 0,
        total_success: 0,
        total_failure: 0,
      }
    );
  }, [query.data?.traefik?.reload]);

  return (
    <Grid
      css={css`
        position: relative;
      `}
    >
      <Grid.Col span={12} md={4}>
        <TextStats title="Server Uptime" icon={TbActivity} value={(time.uptime / HOUR).toFixed(2) + "H"} />
      </Grid.Col>
      <Grid.Col span={12} md={4}>
        <TextStats title="Server Time" icon={TbClock} value={day(time.current).format("YYYY-MM-DD HH:mm")} />
      </Grid.Col>
      <Grid.Col span={12} md={4}>
        <TextStats title="Server TimeZone" icon={TbCalendarStats} value={time.timezone} />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats title="CPU" icon={TbCpu2} value={(cpu.used / cpu.total) * 100} />
      </Grid.Col>
      <Grid.Col span={12} md={3}>
        <PercStats
          title="Memory"
          icon={TbDatabase}
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
          icon={TbDatabaseExport}
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
            <Tooltip label="Switch to Another Disk" withArrow transition="pop" transitionDuration={300} zIndex={1998}>
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
          icon={TbArchive}
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
              name: "Success",
              value: requests.success.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.success.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
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
              name: "Failed（4xx）",
              value: requests.failure4.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.failure4.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
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
              name: "Failed（5xx）",
              value: requests.failure5.reduce((a, [, i]) => a + i, 0),
              tooltip: requests.failure5.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
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
              name: "Expiring",
              value: certs.expiring.length,
              tooltip: certs.expiring.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {certs.expiring.map(([i]) => (
                    <List.Item key={`cert-expiring-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Expired",
              value: certs.expired.length,
              tooltip: certs.expired.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {certs.expired.map(([i]) => (
                    <List.Item key={`cert-expired-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Normal",
              value: certs.normal.length,
              tooltip: certs.normal.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
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
              name: "Failed",
              value: reload.total_failure,
              tooltip: `Last failed: ${day(reload.last_failure).format("YYYY-MM-DD HH:mm")}`,
            },
            {
              name: "Success",
              value: reload.total_success,
              tooltip: `Last success: ${day(reload.last_success).format("YYYY-MM-DD HH:mm")}`,
            },
          ]}
        />
      </Grid.Col>
    </Grid>
  );
};
