import React, { ReactNode, useMemo } from "react";
import { Box, Card, Center, Group, Progress, RingProgress, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { css } from "@emotion/react";
import { usePrevious } from "@mantine/hooks";
import { IconType } from "react-icons";
import { TbArrowDown, TbArrowUp } from "react-icons/all";

export interface PercStatsProps {
  title: ReactNode;
  icon: IconType;
  value:
    | number
    | {
        used: number;
        total: number;
        unit: string;
      };
}

export const PercStats: React.FC<PercStatsProps> = ({ title, icon: Icon, value }) => {
  const t = useMantineTheme();
  const perc = typeof value === "number" ? value : (value.used / value.total) * 100;
  const unit = typeof value === "number" ? "%" : value.unit;
  const prev = usePrevious(perc);
  const diff = Math.round((prev ? (perc - prev) / prev : 0) * 100) / 100;
  return (
    <Card
      withBorder
      css={css`
        padding: ${t.spacing.md}px;
        border-radius: ${t.radius.sm}px;
      `}
    >
      <Group position="apart">
        <Text
          css={css`
            color: ${t.fn.primaryColor()};
            font-size: ${t.fontSizes.xs}px;
            font-weight: 700;
            text-transform: uppercase;
          `}
        >
          {title}
        </Text>
        <Icon
          css={css`
            color: ${t.fn.primaryColor()};
          `}
        />
      </Group>
      <Group
        align="flex-end"
        spacing="xs"
        css={css`
          margin-top: ${t.spacing.md}px;
          flex-wrap: nowrap;
        `}
      >
        <Tooltip
          label={`Real-time Status: ${
            typeof value === "number"
              ? value.toFixed(2) + unit
              : value.used.toFixed(2) + unit + " / " + value.total.toFixed(2) + unit
          }`}
        >
          <Text
            css={css`
              font-size: ${t.fontSizes.md * 1.7}px;
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
          <Tooltip label={`Percentage Change: ${diff.toFixed(2)}%`}>
            <Text
              color={diff > 0 ? "red" : "teal"}
              css={css`
                display: inline-flex;
                align-items: center;
                font-weight: 500;
                font-size: ${t.fontSizes.sm}px;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              `}
            >
              {Math.abs(diff).toFixed(2) + "%"}
              {diff > 0 && <TbArrowUp />}
              {diff < 0 && <TbArrowDown />}
            </Text>
          </Tooltip>
        )}
      </Group>
      <Progress
        value={perc}
        css={css`
          margin-top: ${t.spacing.md}px;

          .mantine-Progress-label {
            font-size: ${t.fontSizes.sm}px;
          }
        `}
      />
      <Text
        color="dimmed"
        css={css`
          margin-top: ${t.spacing.xs}px;
          font-size: ${t.fontSizes.xs}px;
        `}
      >
        Percentage：{perc.toFixed(2)}%
      </Text>
    </Card>
  );
};

export interface TextStatsProps {
  title: ReactNode;
  icon: IconType;
  value: ReactNode;
}

export const TextStats: React.FC<TextStatsProps> = ({ title, icon: Icon, value }) => {
  const t = useMantineTheme();
  return (
    <Card
      withBorder
      css={css`
        padding: ${t.spacing.md}px;
        border-radius: ${t.radius.sm}px;
      `}
    >
      <Group>
        <RingProgress
          size={80}
          roundCaps
          thickness={8}
          sections={[{ value: 100, color: t.primaryColor }]}
          label={
            <Center>
              <Icon />
            </Center>
          }
        />
        <Box>
          <Text
            css={css`
              color: ${t.fn.primaryColor()};
              font-size: ${t.fontSizes.xs}px;
              font-weight: 700;
              text-transform: uppercase;
            `}
          >
            {title}
          </Text>
          <Text
            css={css`
              font-size: ${t.fontSizes.xl}px;
              font-weight: 700;
            `}
          >
            {value}
          </Text>
        </Box>
      </Group>
    </Card>
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
  const t = useMantineTheme();
  const primary = useMemo(() => (value.length ? value[0] : { name: "Unknown", value: 0 }), [value]);
  const values = useMemo(() => value.slice(1), [value]);
  const total = useMemo(() => value.reduce((a, i) => a + i.value, 0) || 1, [value]);
  return (
    <Card
      withBorder
      css={css`
        padding: ${t.spacing.md}px;
        border-radius: ${t.radius.sm}px;
        overflow: visible;
      `}
    >
      <Text
        css={css`
          color: ${t.fn.primaryColor()};
          font-size: ${t.fontSizes.xs}px;
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
          <Tooltip disabled={!primary.tooltip} label={primary.tooltip}>
            <Box>
              <Text
                css={css`
                  font-size: ${t.fontSizes.md * 1.7}px;
                  font-weight: 700;
                `}
              >
                {primary.value}
              </Text>
              <Text
                color="dimmed"
                css={css`
                  font-size: ${t.fontSizes.xs}px;
                `}
              >
                {primary.name}
              </Text>
            </Box>
          </Tooltip>
          <Group>
            {values.map((item) => (
              <Tooltip key={`card-stats-${item.name}`} disabled={!item.tooltip} label={item.tooltip}>
                <Box>
                  <Text
                    css={css`
                      font-size: ${t.fontSizes.xl}px;
                      font-weight: 700;
                    `}
                  >
                    {item.value}
                  </Text>
                  <Text
                    color="dimmed"
                    css={css`
                      font-size: ${t.fontSizes.xs}px;
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
          sections={[{ value: (primary.value / total) * 100, color: t.primaryColor }]}
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
