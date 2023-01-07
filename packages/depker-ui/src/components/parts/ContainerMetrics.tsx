import React, { useMemo } from "react";
import { useContainerMetrics } from "../../api/use-container-metrics";
import { Card, Grid, Table, Text, useMantineTheme } from "@mantine/core";
import { CardStats, PercStats } from "../core/Stats";
import { TbCpu2, TbDatabase } from "react-icons/all";
import { humanBytes } from "../../utils/human";
import { css } from "@emotion/react";

export type ContainerMetricsProps = {
  name: string;
};

export const ContainerMetrics: React.FC<ContainerMetricsProps> = ({ name }) => {
  const t = useMantineTheme();
  const metrics = useContainerMetrics(name!);

  const Cpu = useMemo(
    () => (
      <Grid.Col span={6}>
        <PercStats title="CPU" icon={TbCpu2} value={((metrics?.cpu.used ?? 0) / (metrics?.cpu.total ?? 1)) * 100} />
      </Grid.Col>
    ),
    [metrics?.cpu]
  );

  const Memory = useMemo(
    () => (
      <Grid.Col span={6}>
        <PercStats
          title="Memory"
          icon={TbDatabase}
          value={{
            used: metrics?.memory.used ?? 0,
            total: metrics?.memory.total ?? 0,
            unit: humanBytes,
          }}
        />
      </Grid.Col>
    ),
    [metrics?.memory]
  );

  const Network = useMemo(
    () => (
      <Grid.Col span={6}>
        <CardStats
          title="Network"
          value={[
            {
              name: "Output",
              value: metrics?.network.output ?? 0,
              unit: humanBytes,
            },
            {
              name: "Input",
              value: metrics?.network.input ?? 0,
              unit: humanBytes,
            },
          ]}
        />
      </Grid.Col>
    ),
    [metrics?.network]
  );

  const Process = useMemo(
    () =>
      metrics && (
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
            <Table striped highlightOnHover withBorder withColumnBorders>
              <thead>
                <tr>
                  {metrics.process.titles.map((title) => (
                    <th key={`process:title:${title}`}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.process.processes.map((process, index) => (
                  <tr key={`process:${index}`}>
                    {process.map((item, idx) => (
                      <td key={`process:${index}:item:${idx}`}>{item}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Grid.Col>
      ),
    [metrics?.process]
  );

  return (
    <Grid>
      {Cpu}
      {Memory}
      {Network}
      {Process}
    </Grid>
  );
};
