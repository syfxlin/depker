import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Grid, Stack, Table, Text, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { useServiceMetrics } from "../api/use-service-metrics";
import { CardStats, PercStats } from "../components/core/Stats";
import { TbCpu2, TbDatabase } from "react-icons/all";
import { humanBytes } from "../utils/human";

export const ServiceMetricsTab: React.FC = () => {
  const t = useMantineTheme();
  const { service } = useParams<"service">();
  const metrics = useServiceMetrics(service!);

  const Cpu = useMemo(
    () => (
      <Grid.Col span={6}>
        <PercStats
          title="CPU"
          icon={TbCpu2}
          value={((metrics.data?.cpu.used ?? 0) / (metrics.data?.cpu.total ?? 1)) * 100}
        />
      </Grid.Col>
    ),
    [metrics.data?.cpu]
  );

  const Memory = useMemo(
    () => (
      <Grid.Col span={6}>
        <PercStats
          title="Memory"
          icon={TbDatabase}
          value={{
            used: metrics.data?.memory.used ?? 0,
            total: metrics.data?.memory.total ?? 0,
            unit: humanBytes,
          }}
        />
      </Grid.Col>
    ),
    [metrics.data?.memory]
  );

  const Network = useMemo(
    () => (
      <Grid.Col span={6}>
        <CardStats
          title="Network"
          value={[
            {
              name: "Output",
              value: metrics.data?.network.output ?? 0,
              unit: humanBytes,
            },
            {
              name: "Input",
              value: metrics.data?.network.input ?? 0,
              unit: humanBytes,
            },
          ]}
        />
      </Grid.Col>
    ),
    [metrics.data?.network]
  );

  const Process = useMemo(
    () =>
      metrics.data && (
        <Grid.Col span={12}>
          <Card withBorder>
            <Text
              css={css`
                color: ${t.fn.primaryColor()};
                font-size: ${t.fontSizes.xs}px;
                font-weight: 700;
                text-transform: uppercase;
                padding-bottom: ${t.spacing.xs}px;
              `}
            >
              Processes List
            </Text>
            <Table>
              <thead>
                <tr>
                  {metrics.data.process.titles.map((title) => (
                    <th key={`title-${title}`}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.data.process.processes.map((process, index) => (
                  <tr key={`process-${index}`}>
                    {process.map((item, idx) => (
                      <td key={`item-${index}-${idx}`}>{item}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Grid.Col>
      ),
    [metrics.data?.process]
  );

  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Service Metrics</Heading>
      <Grid>
        {Cpu}
        {Memory}
        {Network}
        {Process}
      </Grid>
    </Stack>
  );
};
