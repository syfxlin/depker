import { ActionIcon, Box, Center, Group, Input, Text, Tooltip } from "@mantine/core";
import React, {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";
import Anser from "anser";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { IconArrowDown, IconArrowUp, IconList, IconSearch } from "@tabler/icons";
import { useDebounce } from "react-use";

export interface LineProps {
  index: number;
  data: string;
  highlight?: boolean;
  style?: CSSProperties;
}

export const Line: React.FC<LineProps> = ({ style, index, data, highlight }) => {
  const { u } = useU();
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
        font-family: ${u.f("mono")};
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
          }
        }
        .ansi-red {
          &-fg {
            color: #ff8182;
          }
          &-bg {
          }
        }
        .ansi-green {
          &-fg {
            color: #4ac26b;
          }
          &-bg {
          }
        }
        .ansi-yellow {
          &-fg {
            color: #d4a72c;
          }
          &-bg {
          }
        }
        .ansi-blue {
          &-fg {
            color: #54aeff;
          }
          &-bg {
          }
        }
        .ansi-magenta {
          &-fg {
            color: #c297ff;
          }
          &-bg {
          }
        }
        .ansi-cyan {
          &-fg {
            color: #76e3ea;
          }
          &-bg {
          }
        }
        .ansi-white {
          &-fg {
            color: #d0d7de;
          }
          &-bg {
          }
        }

        .ansi-bright-black {
          &-fg {
            color: #32383f;
          }
          &-bg {
          }
        }
        .ansi-bright-red {
          &-fg {
            color: #ffaba8;
          }
          &-bg {
          }
        }
        .ansi-bright-green {
          &-fg {
            color: #6fdd8b;
          }
          &-bg {
          }
        }
        .ansi-bright-yellow {
          &-fg {
            color: #eac54f;
          }
          &-bg {
          }
        }
        .ansi-bright-blue {
          &-fg {
            color: #80ccff;
          }
          &-bg {
          }
        }
        .ansi-bright-magenta {
          &-fg {
            color: #d8b9ff;
          }
          &-bg {
          }
        }
        .ansi-bright-cyan {
          &-fg {
          }
          &-bg {
          }
        }
        .ansi-bright-white {
          &-fg {
            color: #d0d7de;
          }
          &-bg {
            color: #b3f0ff;
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

export interface LogsProps {
  title: ReactNode;
  index: number;
  data: string[];
}

export const Logs: React.FC<LogsProps> = (props) => {
  const { u } = useU();
  const ref = useRef<FixedSizeList | null>();
  const lines = useMemo(() => props.data.map((i) => Anser.ansiToText(i).toUpperCase()), [props.data]);

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
    if (ref.current && result.length > index) {
      ref.current?.scrollToItem(result[index], "center");
    }
  }, [index, result, ref]);
  useEffect(() => {
    if (ref.current && follow && !search) {
      ref.current?.scrollToItem(lines.length, "end");
    }
  }, [search, lines, ref, follow]);

  // render
  return (
    <Box
      css={css`
        color: #d0d7de;
        background-color: #24292f;
        padding: ${u.sp(3)};
        border-radius: ${u.br(2)};
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: ${u.fs(10)};

        *::-webkit-scrollbar-track {
          background: ${u.c("white,1")};
          box-shadow: inset 0 0 5px ${u.c("white,1")};
        }
        *::-webkit-scrollbar-thumb {
          background: ${u.c("white,2")};
          box-shadow: inset 0 0 10px ${u.c("white,2")};
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
            padding-left: ${u.sp(4)};
          `}
        >
          {props.title}
        </Text>
        <Group
          spacing="xs"
          css={css`
            font-size: ${u.fs("sm")};
            border-radius: ${u.br(1)};
            overflow: hidden;
            display: flex;
            color: #f6f8fa;
            background-color: #32383f;
            padding: ${u.sp(1)};
          `}
        >
          <Input
            icon={<IconSearch size={u.fs("default")} color="#8c959f" />}
            placeholder="Search logs"
            variant="unstyled"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
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
                height: ${u.fs("sm")};
                font-size: ${u.fs("sm")};
              }
            `}
          />
          <Text
            css={css`
              color: #8c959f;
              font-size: ${u.fs("xs")};
            `}
          >
            {Math.min(result.length, index + 1)} / {result.length}
          </Text>
          <Tooltip label="Prev" withArrow={true} transition="pop" transitionDuration={300} zIndex={1998}>
            <ActionIcon
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
              css={css`
                color: #8c959f;

                &:hover {
                  background-color: rgba(255, 255, 255, 0.125);
                }
              `}
            >
              <IconArrowUp size={u.fs("default")} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Next" withArrow={true} transition="pop" transitionDuration={300} zIndex={1998}>
            <ActionIcon
              onClick={() => setIndex((v) => Math.min(result.length - 1, v + 1))}
              css={css`
                color: #8c959f;

                &:hover {
                  background-color: rgba(255, 255, 255, 0.125);
                }
              `}
            >
              <IconArrowDown size={u.fs("default")} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Follow" withArrow={true} transition="pop" transitionDuration={300} zIndex={1998}>
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
              <IconList size={u.fs("default")} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>
      <Box
        css={css`
          flex: 1;
          margin-top: ${u.sp(2)};
        `}
      >
        <AutoSizer>
          {(size) =>
            props.data.length ? (
              <FixedSizeList
                width={size.width}
                height={size.height}
                itemSize={12 * 1.7}
                itemCount={props.data.length}
                ref={(i) => (ref.current = i)}
              >
                {(p) => (
                  <Line
                    style={p.style}
                    index={props.index + p.index}
                    data={props.data[p.index]}
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
                  font-family: ${u.f("mono")};
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
    </Box>
  );
};
