import React, {
  ChangeEvent,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionIcon,
  Box,
  BoxProps,
  Center,
  Group,
  Input,
  Popover,
  Select,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import Anser from "anser";
import { css } from "@emotion/react";
import { LogLevel } from "@syfxlin/depker-client";
import { DateTime } from "luxon";
import { Flex, FlexProps } from "./Flex";
import { FixedSizeList } from "react-window";
import { useDebouncedValue } from "@mantine/hooks";
import AutoSizer from "react-virtualized-auto-sizer";
import { TbArrowDown, TbArrowUp, TbInfinity, TbMenu2, TbSearch } from "react-icons/all";
import { colors } from "../../utils/color";

export type LineProps = BoxProps & {
  index?: number;
  data?: string | [LogLevel, number, string];
  highlight?: boolean;
  timestamp?: boolean;
};

export const Line = forwardRef<HTMLDivElement, LineProps>((props, ref) => {
  const { index, data, highlight, timestamp, ...other } = props;
  const t = useMantineTheme();
  const html = useMemo(() => {
    if (!data) {
      return "";
    }
    const c = {
      error: "\u001b[31m",
      success: "\u001b[32m",
      debug: "\u001b[33m",
      log: "\u001b[34m",
      step: "\u001b[36m",
      time: "\u001b[36m",
      none: "\u001b[0m",
    };
    const p = (value: string) => {
      return Anser.ansiToHtml(Anser.escapeForHtml(value), { use_classes: true });
    };
    if (typeof data === "string") {
      return p(data);
    }
    const [level, time, logs] = data;
    const part1 = DateTime.fromMillis(parseInt(time as any)).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    const part2 = level.toUpperCase().padStart(5);
    const part3 = logs;
    if (timestamp) {
      return p(`${c.time}[${part1}]${c.none} ${c[level]}${part2}${c.none} ${part3}`);
    } else {
      return p(`${c[level]}${part2}${c.none} ${part3}`);
    }
  }, [data, timestamp]);
  return (
    <Box
      data-index={index}
      data-highlight={highlight}
      {...other}
      ref={ref}
      css={css`
        line-height: 1.7;
        font-weight: 400;
        font-size: 12px;
        font-family: ${t.fontFamilyMonospace};
        white-space: pre;
        color: ${colors.foreground};
        background-color: ${colors.background};

        &:hover {
          color: #f6f8fa;
          background-color: #32383f;
        }

        .line-index {
          display: inline-block;
          user-select: none;
          text-align: right;
          text-decoration: none;
          margin-right: 12px;
          width: 48px;
          opacity: 0.5;

          &:before {
            content: attr(data-index);
          }
        }

        &[data-highlight="true"] {
          color: #54aeff;
          background-color: rgba(33, 139, 255, 0.15);

          .line-index {
            text-decoration: underline;
            opacity: 1;
          }
        }

        .ansi-black {
          &-fg {
            color: ${colors.black};
          }
          &-bg {
            background-color: ${colors.black};
          }
        }
        .ansi-red {
          &-fg {
            color: ${colors.red};
          }
          &-bg {
            background-color: ${colors.red};
          }
        }
        .ansi-green {
          &-fg {
            color: ${colors.green};
          }
          &-bg {
            background-color: ${colors.green};
          }
        }
        .ansi-yellow {
          &-fg {
            color: ${colors.yellow};
          }
          &-bg {
            background-color: ${colors.yellow};
          }
        }
        .ansi-blue {
          &-fg {
            color: ${colors.blue};
          }
          &-bg {
            background-color: ${colors.blue};
          }
        }
        .ansi-magenta {
          &-fg {
            color: ${colors.magenta};
          }
          &-bg {
            background-color: ${colors.magenta};
          }
        }
        .ansi-cyan {
          &-fg {
            color: ${colors.cyan};
          }
          &-bg {
            background-color: ${colors.cyan};
          }
        }
        .ansi-white {
          &-fg {
            color: ${colors.white};
          }
          &-bg {
            background-color: ${colors.white};
          }
        }

        .ansi-bright-black {
          &-fg {
            color: ${colors.brightBlack};
          }
          &-bg {
            background-color: ${colors.brightBlack};
          }
        }
        .ansi-bright-red {
          &-fg {
            color: ${colors.brightRed};
          }
          &-bg {
            background-color: ${colors.brightRed};
          }
        }
        .ansi-bright-green {
          &-fg {
            color: ${colors.brightGreen};
          }
          &-bg {
            background-color: ${colors.brightGreen};
          }
        }
        .ansi-bright-yellow {
          &-fg {
            color: ${colors.brightYellow};
          }
          &-bg {
            background-color: ${colors.brightYellow};
          }
        }
        .ansi-bright-blue {
          &-fg {
            color: ${colors.brightBlue};
          }
          &-bg {
            background-color: ${colors.brightBlue};
          }
        }
        .ansi-bright-magenta {
          &-fg {
            color: ${colors.brightMagenta};
          }
          &-bg {
            background-color: ${colors.brightMagenta};
          }
        }
        .ansi-bright-cyan {
          &-fg {
            color: ${colors.brightCyan};
          }
          &-bg {
            background-color: ${colors.brightCyan};
          }
        }
        .ansi-bright-white {
          &-fg {
            color: ${colors.brightWhite};
          }
          &-bg {
            background-color: ${colors.brightWhite};
          }
        }

        .ansi-bold {
          font-weight: 600;
        }
        .ansi-dim {
          opacity: 0.5;
        }
        .ansi-italic {
          font-style: italic;
        }
        .ansi-underline {
          text-decoration: underline;
        }
        .ansi-blink {
          text-decoration: blink;
        }
        .ansi-hidden {
          visibility: hidden;
        }
        .ansi-strikethrough {
          text-decoration: line-through;
        }
      `}
    >
      <span className="line-index" data-index={index} />
      <span className="line-data" data-index={index} dangerouslySetInnerHTML={{ __html: html }} />
    </Box>
  );
});

export type EmptyProps = BoxProps & {
  width: number;
  height: number;
  children: ReactNode;
};

export const Empty = forwardRef<HTMLDivElement, EmptyProps>((props, ref) => {
  const { width, height, children, ...other } = props;
  const t = useMantineTheme();
  return (
    <Center
      {...other}
      ref={ref}
      css={css`
        width: ${width}px;
        height: ${height}px;
        line-height: 1.7;
        font-weight: 400;
        font-size: 12px;
        font-family: ${t.fontFamilyMonospace};
        white-space: pre;
        color: ${colors.foreground};
        background-color: ${colors.background};
      `}
    >
      {children}
    </Center>
  );
});

export type LogsProps = FlexProps & {
  title: ReactNode;
  empty: ReactNode;
  data: Array<string | [LogLevel, number, string]>;
  children?: ReactNode;
};

export const Logs = forwardRef<HTMLDivElement, LogsProps>(({ title, empty, data, children, ...other }, ref) => {
  const t = useMantineTheme();

  // search
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState<string>("");
  const [result, setResult] = useState<number[]>([]);
  const [debounced] = useDebouncedValue(search, 500);
  // prettier-ignore
  const indexes = useMemo(() => data.map((i) => Anser.ansiToText(typeof i === "string" ? i : i[2]).toUpperCase()), [data]);

  // options
  const [follow, setFollow] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // data
  const list = useRef<FixedSizeList | null>();

  // calculate search
  useEffect(() => {
    setIndex(0);
    if (!debounced) {
      setResult([]);
    } else {
      setResult(indexes.map((s, i) => (s.indexOf(debounced.toUpperCase()) !== -1 ? i : -1)).filter((i) => i !== -1));
    }
  }, [debounced, data, indexes]);
  // scroll to search target
  useEffect(() => {
    if (list.current && result.length > index) {
      list.current?.scrollToItem(result[index], "center");
    }
  }, [index, result, list]);
  // scroll to end
  useEffect(() => {
    if (list.current && follow && !search) {
      list.current?.scrollToItem(data.length, "end");
    }
  }, [data, list, follow, search]);

  // components
  const Outer = useMemo(
    () =>
      forwardRef<HTMLDivElement, any>((props, ref) => {
        return (
          <Box
            {...props}
            ref={ref}
            onScroll={(e: UIEvent<HTMLDivElement>) => {
              props.onScroll?.(e);
              if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight < 50) {
                setFollow(true);
              } else {
                setFollow(false);
              }
            }}
          >
            {props.children}
          </Box>
        );
      }),
    []
  );

  const Content = useMemo(
    () => (
      <AutoSizer>
        {(size) => {
          if (!data.length) {
            return (
              <Empty width={size.width} height={size.height}>
                {empty}
              </Empty>
            );
          } else {
            return (
              <FixedSizeList
                width={size.width}
                height={size.height - t.spacing.xs}
                itemSize={12 * 1.7}
                itemCount={data.length}
                ref={(i) => (list.current = i)}
                style={{ paddingBottom: t.spacing.xs, boxSizing: "content-box" }}
                outerElementType={Outer}
              >
                {(p) => (
                  <Line
                    style={p.style}
                    index={1 + p.index}
                    data={data[p.index]}
                    highlight={result.length > index && result[index] === p.index}
                    timestamp={timestamps}
                  />
                )}
              </FixedSizeList>
            );
          }
        }}
      </AutoSizer>
    ),
    [t, list, timestamps, empty, data, result, index, Outer]
  );

  const Title = useMemo(
    () => (
      <Text
        css={css`
          color: #d0d7de;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-left: ${t.spacing.md}px;
        `}
      >
        {title}
      </Text>
    ),
    [t, title]
  );

  const Search = useMemo(
    () => (
      <>
        <Input
          autoFocus
          icon={<TbSearch color="#8c959f" />}
          placeholder="Search logs"
          variant="unstyled"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.ctrlKey) {
              setIndex((v) => (v + 1 >= result.length ? 0 : v + 1));
            } else if (e.key === "Enter" && e.ctrlKey) {
              setIndex((v) => (v - 1 < 0 ? result.length - 1 : v - 1));
            }
          }}
          css={css`
            .mantine-Input-input {
              color: inherit;
              height: ${t.fontSizes.sm}px;
              font-size: ${t.fontSizes.sm}px;
            }
          `}
        />
        <Text
          css={css`
            color: #8c959f;
            font-size: ${t.fontSizes.xs}px;
          `}
        >
          {Math.min(result.length, index + 1)} / {result.length}
        </Text>
        <Tooltip label="Prev">
          <ActionIcon
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
            css={css`
              color: #8c959f;

              &:hover {
                background-color: rgba(255, 255, 255, 0.125);
              }
            `}
          >
            <TbArrowUp />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Next">
          <ActionIcon
            onClick={() => setIndex((v) => Math.min(result.length - 1, v + 1))}
            css={css`
              color: #8c959f;

              &:hover {
                background-color: rgba(255, 255, 255, 0.125);
              }
            `}
          >
            <TbArrowDown />
          </ActionIcon>
        </Tooltip>
      </>
    ),
    [t, index, search, result]
  );

  const Addon = useMemo(
    () =>
      children && (
        <Popover shadow="md" withArrow position="bottom-end" width={t.fontSizes.md * 20}>
          <Popover.Target>
            <ActionIcon
              css={css`
                color: #8c959f;

                &:hover {
                  background-color: rgba(255, 255, 255, 0.125);
                }
              `}
            >
              <TbMenu2 />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack spacing={t.spacing.xs * 0.5}>
              <Select
                size="xs"
                label="Follow Logs"
                description="Follow log output"
                placeholder="Follow Logs"
                icon={<TbInfinity />}
                value={follow ? "true" : "false"}
                onChange={(value) => setFollow(value === "true")}
                data={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
              />
              <Select
                size="xs"
                label="Show Timestamps"
                description="Show log timestamps"
                placeholder="Show Timestamps"
                icon={<TbInfinity />}
                value={timestamps ? "true" : "false"}
                onChange={(value) => setTimestamps(value === "true")}
                data={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
              />
              <Select
                size="xs"
                label="Show Fullscreen"
                description="Show log fullscreen"
                placeholder="Show Fullscreen"
                icon={<TbInfinity />}
                value={fullscreen ? "true" : "false"}
                onChange={(value) => setFullscreen(value === "true")}
                data={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
              />
              {children}
            </Stack>
          </Popover.Dropdown>
        </Popover>
      ),
    [follow, timestamps, fullscreen, children]
  );

  const Header = useMemo(
    () => (
      <Group
        spacing="xs"
        css={css`
          font-size: ${t.spacing.sm}px;
          border-radius: ${t.radius.sm}px;
          overflow: hidden;
          display: flex;
          color: #f6f8fa;
          background-color: #32383f;
          padding: ${t.spacing.xs * 0.5}px;
        `}
      >
        {Search}
        {Addon}
      </Group>
    ),
    [t, Search, Addon]
  );

  return (
    <Flex
      {...other}
      ref={ref}
      css={css`
        color: ${colors.foreground};
        background-color: ${colors.background};
        padding: ${t.spacing.xs}px;
        border-radius: ${t.radius.sm}px;
        min-height: ${t.fontSizes.md * 10}px;

        ${fullscreen &&
        css`
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-radius: 0;
        `}

        *::-webkit-scrollbar-track {
          background: ${t.fn.rgba(t.white, 0.1)};
          box-shadow: inset 0 0 5px ${t.fn.rgba(t.white, 0.1)};
        }
        *::-webkit-scrollbar-thumb {
          background: ${t.fn.rgba(t.white, 0.2)};
          box-shadow: inset 0 0 10px ${t.fn.rgba(t.white, 0.2)};
        }
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
        `}
      >
        {Title}
        {Header}
      </Box>
      <Box
        css={css`
          flex: 1;
          margin-top: ${t.spacing.xs}px;
        `}
      >
        {Content}
      </Box>
    </Flex>
  );
});
