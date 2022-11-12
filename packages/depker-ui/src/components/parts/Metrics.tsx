import React, { useMemo, useState } from "react";
import { CardStats, PercStats, TextStats } from "../core/Stats";
import { Grid, List, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { useMetrics } from "../../api/use-metrics";
import { TbActivity, TbArchive, TbCalendarStats, TbClock, TbCpu2, TbDatabase, TbDatabaseExport } from "react-icons/all";
import { DateTime } from "luxon";
import { humanBytes, humanCounts, humanDate, humanTimes } from "../../utils/human";

export const Metrics: React.FC = () => {
  const t = useMantineTheme();
  const [disk, setDisk] = useState(0);
  const { data } = useMetrics();

  const Uptime = useMemo(
    () => (
      <Grid.Col span={12} md={4}>
        <TextStats title="Server Uptime" icon={TbActivity} value={humanTimes((data?.time?.uptime ?? 0) * 1000)} />
      </Grid.Col>
    ),
    [data?.time?.uptime]
  );

  const CurrentTime = useMemo(
    () => (
      <Grid.Col span={12} md={4}>
        <TextStats
          title="Server Time"
          icon={TbClock}
          value={humanDate(data?.time?.current ?? DateTime.utc().valueOf())}
        />
      </Grid.Col>
    ),
    [data?.time?.current]
  );

  const TimeZone = useMemo(
    () => (
      <Grid.Col span={12} md={4}>
        <TextStats
          title="Server TimeZone"
          icon={TbCalendarStats}
          value={data?.time?.timezone ?? DateTime.local().zoneName}
        />
      </Grid.Col>
    ),
    [data?.time?.timezone]
  );

  const Cpu = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <PercStats title="CPU" icon={TbCpu2} value={((data?.cpu?.used ?? 0) / (data?.cpu?.total ?? 1)) * 100} />
      </Grid.Col>
    ),
    [data?.cpu]
  );

  const Memory = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <PercStats
          title="Memory"
          icon={TbDatabase}
          value={{
            used: data?.memory?.used ?? 0,
            total: data?.memory?.total ?? 0,
            unit: humanBytes,
          }}
        />
      </Grid.Col>
    ),
    [data?.memory]
  );

  const Swap = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <PercStats
          title="Swap"
          icon={TbDatabaseExport}
          value={{
            used: data?.swap?.used ?? 0,
            total: data?.swap?.total ?? 0,
            unit: humanBytes,
          }}
        />
      </Grid.Col>
    ),
    [data?.swap]
  );

  const Disk = useMemo(() => {
    const disks = data?.disk?.[disk % data.disk.length];
    return (
      <Grid.Col span={12} md={3}>
        <PercStats
          title={
            <Tooltip label="Switch to Another Disk">
              <Text
                onClick={() => setDisk((v) => v + 1)}
                css={css`
                  cursor: pointer;
                  user-select: none;
                `}
              >
                Disk {disks?.name ?? "U"} ({disks?.type ?? "Unknown"})
              </Text>
            </Tooltip>
          }
          icon={TbArchive}
          value={{
            used: disks?.used ?? 0,
            total: disks?.total ?? 0,
            unit: humanBytes,
          }}
        />
      </Grid.Col>
    );
  }, [data?.disk, disk]);

  const Requests = useMemo(() => {
    const items = Object.entries(data?.traefik?.requests ?? {}) as [string, number][];
    const success = items.filter(([c]) => parseInt(c) < 400);
    const failure4 = items.filter(([c]) => parseInt(c) >= 400 && parseInt(c) < 500);
    const failure5 = items.filter(([c]) => parseInt(c) >= 500);
    return (
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Requests"
          value={[
            {
              name: "Success",
              value: success.reduce((a, [, i]) => a + i, 0),
              unit: humanCounts,
              tooltip: success.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {success.map(([i, c]) => (
                    <List.Item key={`request-success-${i}`}>
                      Code {i}: {c}
                    </List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Failed（4xx）",
              value: failure4.reduce((a, [, i]) => a + i, 0),
              unit: humanCounts,
              tooltip: failure4.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {failure4.map(([i, c]) => (
                    <List.Item key={`request-failure4-${i}`}>
                      Code {i}: {c}
                    </List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Failed（5xx）",
              value: failure5.reduce((a, [, i]) => a + i, 0),
              unit: humanCounts,
              tooltip: failure5.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {failure5.map(([i, c]) => (
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
    );
  }, [data?.traefik?.requests]);

  const Certificates = useMemo(() => {
    const now = DateTime.utc();
    const items = Object.entries(data?.traefik?.certs ?? {}).map(([n, t]) => [n, DateTime.fromMillis(t)]) as Array<
      [string, DateTime]
    >;
    const expired = items.filter(([, i]) => i < now);
    const expiring = items.filter(([, i]) => i >= now && i.plus({ days: 30 }) < now);
    const normal = items.filter(([, i]) => i.plus({ days: 30 }) >= now);
    return (
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Certificates"
          value={[
            {
              name: "Expiring",
              value: expiring.length,
              unit: humanCounts,
              tooltip: expiring.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {expiring.map(([i]) => (
                    <List.Item key={`cert-expiring-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Expired",
              value: expired.length,
              unit: humanCounts,
              tooltip: expired.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {expired.map(([i]) => (
                    <List.Item key={`cert-expired-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
            {
              name: "Normal",
              value: normal.length,
              unit: humanCounts,
              tooltip: normal.length && (
                <List
                  css={css`
                    color: ${t.white};
                    font-size: ${t.fontSizes.xs}px;
                  `}
                >
                  {normal.map(([i]) => (
                    <List.Item key={`cert-normal-${i}`}>{i}</List.Item>
                  ))}
                </List>
              ),
            },
          ]}
        />
      </Grid.Col>
    );
  }, [data?.traefik?.certs]);

  const Connections = useMemo(() => {
    const items = Object.entries(data?.traefik?.connections ?? {}) as Array<[string, number]>;
    const connections = items
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([n, c]) => ({ name: n.toUpperCase(), value: c, unit: humanCounts }));
    return (
      <Grid.Col span={12} md={3}>
        <CardStats title="Connections (Top 3)" value={connections} />
      </Grid.Col>
    );
  }, [data?.traefik?.connections]);

  const Reloads = useMemo(
    () => (
      <Grid.Col span={12} md={3}>
        <CardStats
          title="Traefik Reloads"
          value={[
            {
              name: "Failed",
              value: data?.traefik?.reload?.total_failure ?? 0,
              unit: humanCounts,
              tooltip: `Last failed: ${humanDate(data?.traefik?.reload?.last_failure ?? DateTime.utc().valueOf())}`,
            },
            {
              name: "Success",
              value: data?.traefik?.reload?.total_success ?? 0,
              unit: humanCounts,
              tooltip: `Last success: ${humanDate(data?.traefik?.reload?.last_success ?? DateTime.utc().valueOf())}`,
            },
          ]}
        />
      </Grid.Col>
    ),
    [data?.traefik?.reload]
  );

  return (
    <Grid
      css={css`
        position: relative;
      `}
    >
      {Uptime}
      {CurrentTime}
      {TimeZone}
      {Cpu}
      {Memory}
      {Swap}
      {Disk}
      {Requests}
      {Certificates}
      {Connections}
      {Reloads}
    </Grid>
  );
};
