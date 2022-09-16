import React, { ReactNode, useMemo } from "react";
import { IconArrowDown, IconArrowUp, TablerIcon } from "@tabler/icons";
import { Box, Card, Center, Group, Paper, Progress, RingProgress, Text, Tooltip } from "@mantine/core";
import { css } from "@emotion/react";
import { useU } from "@syfxlin/ustyled";
import { usePrevious } from "react-use";

export interface PercStatsProps {
  title: ReactNode;
  icon: TablerIcon;
  value:
    | number
    | {
        used: number;
        total: number;
        unit: string;
      };
}

export const PercStats: React.FC<PercStatsProps> = ({ title, icon: Icon, value }) => {
  const { u } = useU();
  const perc = typeof value === "number" ? value : (value.used / value.total) * 100;
  const unit = typeof value === "number" ? "%" : value.unit;
  const prev = usePrevious(perc);
  const diff = Math.round((prev ? (perc - prev) / prev : 0) * 100) / 100;
  return (
    <Paper
      withBorder
      css={css`
        padding: ${u.sp(4)};
        border-radius: ${u.br(2)};
      `}
    >
      <Group position="apart">
        <Text
          css={css`
            color: ${u.c("primary7", "primary3")};
            font-size: ${u.fs("xs")};
            font-weight: 700;
            text-transform: uppercase;
          `}
        >
          {title}
        </Text>
        <Icon
          size={u.s(5)}
          stroke={u.sp(0.3)}
          css={css`
            color: ${u.c("primary7", "primary3")};
          `}
        />
      </Group>
      <Group
        align="flex-end"
        spacing="xs"
        css={css`
          margin-top: ${u.sp(4)};
          flex-wrap: nowrap;
        `}
      >
        <Tooltip
          label={`实时状态：${
            typeof value === "number"
              ? value.toFixed(2) + unit
              : value.used.toFixed(2) + unit + " / " + value.total.toFixed(2) + unit
          }`}
          withArrow={true}
          transition="pop"
          transitionDuration={300}
          zIndex={998}
        >
          <Text
            css={css`
              font-size: ${u.fs(1.7)};
              font-weight: 700;
              line-height: 1;
              text-overflow: ellipsis;
              white-space: nowrap;
              overflow: hidden;
            `}
          >
            {typeof value === "number" && value.toFixed(2) + unit}
            {typeof value !== "number" && value.used.toFixed(1) + unit + " / " + value.total.toFixed(1) + unit}
          </Text>
        </Tooltip>
        {diff !== 0 && (
          <Tooltip
            label={`状态变化幅度：${diff.toFixed(2)}%`}
            withArrow={true}
            transition="pop"
            transitionDuration={300}
            zIndex={998}
          >
            <Text
              color={diff > 0 ? "red" : "teal"}
              css={css`
                display: inline-flex;
                align-items: center;
                font-weight: 500;
                font-size: ${u.fs("sm")};
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              `}
            >
              {Math.abs(diff).toFixed(2) + "%"}
              {diff > 0 && <IconArrowUp size={u.fs("sm")} stroke={1.5} />}
              {diff < 0 && <IconArrowDown size={u.fs("sm")} stroke={1.5} />}
            </Text>
          </Tooltip>
        )}
      </Group>
      <Progress
        value={perc}
        css={css`
          margin-top: ${u.sp(4)};

          .mantine-Progress-label {
            font-size: ${u.fs("sm")};
          }
        `}
      />
      <Text
        color="dimmed"
        css={css`
          margin-top: ${u.sp(2)};
          font-size: ${u.fs("xs")};
        `}
      >
        比例：{perc.toFixed(2)}%
      </Text>
    </Paper>
  );
};

export interface TextStatsProps {
  title: ReactNode;
  icon: TablerIcon;
  value: ReactNode;
}

export const TextStats: React.FC<TextStatsProps> = ({ title, icon: Icon, value }) => {
  const { u } = useU();
  return (
    <Paper
      withBorder
      css={css`
        padding: ${u.sp(4)};
        border-radius: ${u.br(2)};
      `}
    >
      <Group>
        <RingProgress
          size={80}
          roundCaps
          thickness={8}
          sections={[{ value: 100, color: "violet" }]}
          label={
            <Center>
              <Icon size={22} stroke={1.5} />
            </Center>
          }
        />
        <Box>
          <Text
            css={css`
              color: ${u.c("primary7", "primary3")};
              font-size: ${u.fs("xs")};
              font-weight: 700;
              text-transform: uppercase;
            `}
          >
            {title}
          </Text>
          <Text
            css={css`
              font-size: ${u.fs("xl")};
              font-weight: 700;
            `}
          >
            {value}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
};

export interface CardStatsProps {
  title: ReactNode;
  value: {
    name: string;
    value: number;
    tooltip?: ReactNode;
  }[];
}

export const CardStats: React.FC<CardStatsProps> = ({ title, value }) => {
  const { u, ctx } = useU();
  const primary = useMemo(() => (value.length ? value[0] : { name: "Unknown", value: 0 }), [value]);
  const values = useMemo(() => value.slice(1), [value]);
  const total = useMemo(() => value.reduce((a, i) => a + i.value, 0) || 1, [value]);
  return (
    <Card
      withBorder
      css={css`
        padding: ${u.sp(4)};
        border-radius: ${u.br(2)};
        overflow: visible;
      `}
    >
      <Text
        css={css`
          color: ${u.c("primary7", "primary3")};
          font-size: ${u.fs("xs")};
          font-weight: 700;
          text-transform: uppercase;
        `}
      >
        {title}
      </Text>
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
        `}
      >
        <Box>
          <Tooltip
            disabled={!primary.tooltip}
            label={primary.tooltip}
            withArrow={true}
            transition="pop"
            transitionDuration={300}
            zIndex={998}
          >
            <Box>
              <Text
                css={css`
                  font-size: ${u.fs(1.7)};
                  font-weight: 700;
                `}
              >
                {primary.value}
              </Text>
              <Text
                color="dimmed"
                css={css`
                  font-size: ${u.fs("xs")};
                `}
              >
                {primary.name}
              </Text>
            </Box>
          </Tooltip>
          <Group>
            {values.map((item) => (
              <Tooltip
                key={`card-stats-${item.name}`}
                disabled={!item.tooltip}
                label={item.tooltip}
                withArrow={true}
                transition="pop"
                transitionDuration={300}
                zIndex={998}
              >
                <Box>
                  <Text
                    css={css`
                      font-size: ${u.fs("xl")};
                      font-weight: 700;
                    `}
                  >
                    {item.value}
                  </Text>
                  <Text
                    color="dimmed"
                    css={css`
                      font-size: ${u.fs("xs")};
                    `}
                  >
                    {item.name}
                  </Text>
                </Box>
              </Tooltip>
            ))}
          </Group>
        </Box>
        <RingProgress
          roundCaps
          size={110}
          thickness={8}
          sections={[{ value: (primary.value / total) * 100, color: ctx.primary }]}
          label={
            <div>
              <Text align="center" size="lg">
                {((primary.value / total) * 100).toFixed(0)}%
              </Text>
              <Text align="center" size="xs" color="dimmed">
                {primary.name}
              </Text>
            </div>
          }
        />
      </Box>
    </Card>
  );
};
