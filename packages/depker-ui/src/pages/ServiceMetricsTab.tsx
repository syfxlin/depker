import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Grid, Stack } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { useServiceMetrics } from "../api/use-service-metrics";
import { CardStats, PercStats } from "../components/core/Stats";
import { TbCpu2, TbDatabase } from "react-icons/all";
import { humanBytes } from "../utils/human";

export const ServiceMetricsTab: React.FC = () => {
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
      </Grid>
    </Stack>
  );
};
