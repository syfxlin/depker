import { ActionIcon, Box, Center, Group, Input, Text, Tooltip, useMantineTheme } from "@mantine/core";
import React, {
  ChangeEvent,
  CSSProperties,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { css } from "@emotion/react";
import Anser from "anser";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { useDebounce } from "react-use";
import { Flex, FlexProps } from "./Flex";
import { TbArrowDown, TbArrowUp, TbList, TbSearch } from "react-icons/all";

export interface LineProps {
  index: number;
  data: string;
  highlight?: boolean;
  style?: CSSProperties;
}

export const Line: React.FC<LineProps> = ({ style, index, data, highlight }) => {
  const t = useMantineTheme();
  const html = useMemo(() => Anser.ansiToHtml(Anser.escapeForHtml(data), { use_classes: true }), [data]);
  return (
    <Box
      data-index={index}
      data-highlight={highlight}
      style={style}
      css={css`
        line-height: 1.7;
        font-weight: 400;
        font-size: 12px;
        font-family: ${t.fontFamilyMonospace};
        white-space: pre;
        color: #d0d7de;
        background-color: #24292f;

        &:hover {
          color: #f6f8fa;
          background-color: #32383f;
        }

        &[data-highlight="true"] {
          color: #54aeff;
          background-color: rgba(33, 139, 255, 0.15);
        }

        .ansi-black {
          &-fg {
            color: #24292c;
          }
          &-bg {
            background-color: #24292c;
          }
        }
        .ansi-red {
          &-fg {
            color: #ff8182;
          }
          &-bg {
            background-color: #ff8182;
          }
        }
        .ansi-green {
          &-fg {
            color: #4ac26b;
          }
          &-bg {
            background-color: #4ac26b;
          }
        }
        .ansi-yellow {
          &-fg {
            color: #d4a72c;
          }
          &-bg {
            background-color: #d4a72c;
          }
        }
        .ansi-blue {
          &-fg {
            color: #54aeff;
          }
          &-bg {
            background-color: #54aeff;
          }
        }
        .ansi-magenta {
          &-fg {
            color: #c297ff;
          }
          &-bg {
            background-color: #c297ff;
          }
        }
        .ansi-cyan {
          &-fg {
            color: #76e3ea;
          }
          &-bg {
            background-color: #76e3ea;
          }
        }
        .ansi-white {
          &-fg {
            color: #d0d7de;
          }
          &-bg {
            background-color: #d0d7de;
          }
        }

        .ansi-bright-black {
          &-fg {
            color: #32383f;
          }
          &-bg {
            background-color: #32383f;
          }
        }
        .ansi-bright-red {
          &-fg {
            color: #ffaba8;
          }
          &-bg {
            background-color: #ffaba8;
          }
        }
        .ansi-bright-green {
          &-fg {
            color: #6fdd8b;
          }
          &-bg {
            background-color: #6fdd8b;
          }
        }
        .ansi-bright-yellow {
          &-fg {
            color: #eac54f;
          }
          &-bg {
            background-color: #eac54f;
          }
        }
        .ansi-bright-blue {
          &-fg {
            color: #80ccff;
          }
          &-bg {
            background-color: #80ccff;
          }
        }
        .ansi-bright-magenta {
          &-fg {
            color: #d8b9ff;
          }
          &-bg {
            background-color: #d8b9ff;
          }
        }
        .ansi-bright-cyan {
          &-fg {
            color: #b3f0ff;
          }
          &-bg {
            background-color: #b3f0ff;
          }
        }
        .ansi-bright-white {
          &-fg {
            color: #d0d7de;
          }
          &-bg {
            background-color: #d0d7de;
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
      <span
        data-index={index}
        data-highlight={highlight}
        css={css`
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

          &[data-highlight="true"] {
            text-decoration: underline;
            opacity: 1;
          }
        `}
      />
      <span data-index={index} data-highlight={highlight} dangerouslySetInnerHTML={{ __html: html }} />
    </Box>
  );
};

export type LogsProps = FlexProps & {
  title: ReactNode;
  line: number;
  data: string[];
};

export const Logs = forwardRef<HTMLDivElement, LogsProps>(({ title, line, data, ...props }, ref) => {
  const t = useMantineTheme();
  const list = useRef<FixedSizeList | null>();
  const lines = useMemo(() => data.map((i) => Anser.ansiToText(i).toUpperCase()), [data]);

  // search
  const [index, setIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [result, setResult] = useState<number[]>([]);
  // follow
  const [follow, setFollow] = useState<boolean>(true);

  // effects
  useDebounce(
    () => {
      setIndex(0);
      const indexes = search
        ? lines.map((s, i) => (s.indexOf(search.toUpperCase()) !== -1 ? i : -1)).filter((i) => i !== -1)
        : [];
      setResult(indexes);
    },
    500,
    [search, lines]
  );
  useEffect(() => {
    if (list.current && result.length > index) {
      list.current?.scrollToItem(result[index], "center");
    }
  }, [index, result, list]);
  useEffect(() => {
    if (list.current && follow && !search) {
      list.current?.scrollToItem(lines.length, "end");
    }
  }, [search, lines, list, follow]);

  // render
  return (
    <Flex
      {...props}
      ref={ref}
      css={css`
        color: #d0d7de;
        background-color: #24292f;
        padding: ${t.spacing.xs}px;
        border-radius: ${t.radius.sm}px;
        min-height: ${t.fontSizes.md * 10}px;

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
          <Input
            icon={<TbSearch color="#8c959f" />}
            placeholder="Search logs"
            variant="unstyled"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                setIndex((v) => (v + 1 >= result.length ? 0 : v + 1));
              } else if (e.key === "Enter" && e.shiftKey) {
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
          <Tooltip label="Prev" withArrow transition="pop" transitionDuration={300} zIndex={1998}>
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
          <Tooltip label="Next" withArrow transition="pop" transitionDuration={300} zIndex={1998}>
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
          <Tooltip label="Follow" withArrow transition="pop" transitionDuration={300} zIndex={1998}>
            <ActionIcon
              onClick={() => setFollow((v) => !v)}
              css={css`
                color: #8c959f;
                background-color: ${follow ? "rgba(255, 255, 255, 0.125)" : "transparent"};

                &:hover {
                  background-color: rgba(255, 255, 255, 0.125);
                }
              `}
            >
              <TbList />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>
      <Box
        css={css`
          flex: 1;
          margin-top: ${t.spacing.xs}px;
        `}
      >
        <AutoSizer>
          {(size) =>
            data.length ? (
              <FixedSizeList
                width={size.width}
                height={size.height}
                itemSize={12 * 1.7}
                itemCount={data.length}
                ref={(i) => (list.current = i)}
              >
                {(p) => (
                  <Line
                    style={p.style}
                    index={line + p.index}
                    data={data[p.index]}
                    highlight={result.length > index && result[index] === p.index}
                  />
                )}
              </FixedSizeList>
            ) : (
              <Center
                css={css`
                  width: ${size.width}px;
                  height: ${size.height}px;
                  line-height: 1.7;
                  font-weight: 400;
                  font-size: 12px;
                  font-family: ${t.fontFamilyMonospace};
                  white-space: pre;
                  color: #d0d7de;
                  background-color: #24292f;
                `}
              >
                No logs
              </Center>
            )
          }
        </AutoSizer>
      </Box>
    </Flex>
  );
});
