import React, { ReactElement, ReactNode, useState } from "react";
import {
  ActionIcon,
  Box,
  Collapse,
  Divider,
  Grid,
  Group,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { css } from "@emotion/react";
import { Empty } from "../core/Empty";
import {
  TbArrowsSort,
  TbChevronDown,
  TbChevronRight,
  TbSearch,
  TbSortAscending,
  TbSortDescending,
} from "react-icons/all";
import { SWRResponse } from "swr";
import { Async } from "../core/Async";

export type ListsProps<T> = {
  title: string;
  buttons?: ReactNode[];
  children?: (item: T) => ReactNode;
  // data
  total: number;
  items: T[];
  sorts: string[];
  query: SWRResponse;
  values: {
    page: number;
    size: number;
    sort: [string, "asc" | "desc"];
    search: string;
  };
  update: {
    page: (page: number) => void;
    size: (size: number) => void;
    sort: (sort: [string, "asc" | "desc"]) => void;
    search: (search: string) => void;
  };
};

export const Lists = <T,>(props: ListsProps<T>): ReactElement => {
  const t = useMantineTheme();
  return (
    <Stack spacing="xs">
      <Grid>
        <Grid.Col span={12} md={3}>
          <Text
            css={css`
              font-size: ${t.headings.sizes.h4.fontSize}px;
              font-weight: 500;
            `}
          >
            {props.title}
          </Text>
        </Grid.Col>
        <Grid.Col span={12} md={9}>
          <Group noWrap position="right" spacing="xs">
            <TextInput
              size="xs"
              placeholder="Search..."
              icon={<TbSearch />}
              value={props.values.search}
              onChange={(e) => props.update.search(e.target.value)}
            />
            <Select
              size="xs"
              placeholder="Sort..."
              icon={<TbArrowsSort />}
              value={props.values.sort[0]}
              onChange={(value) => value && props.update.sort([value, props.values.sort[1]])}
              data={props.sorts}
              rightSection={
                <Tooltip label={`Sort direction: ${props.values.sort[1]}`}>
                  <ActionIcon
                    onClick={() =>
                      props.values.sort[0] &&
                      props.update.sort([props.values.sort[0], props.values.sort[1] === "asc" ? "desc" : "asc"])
                    }
                  >
                    {props.values.sort[1] === "asc" ? <TbSortAscending /> : <TbSortDescending />}
                  </ActionIcon>
                </Tooltip>
              }
            />
            {props.buttons}
          </Group>
        </Grid.Col>
      </Grid>
      <Divider />
      <Box
        css={css`
          flex: 1;
          display: flex;
          flex-direction: column;
        `}
      >
        <Async query={props.query}>
          {!props.total ? <Empty /> : props.items.map((item) => props.children?.(item))}
        </Async>
      </Box>
      <Pagination
        page={props.values.page}
        total={Math.max(1, Math.ceil(props.total / props.values.size))}
        withControls
        withEdges
        position="center"
        onChange={props.update.page}
      />
    </Stack>
  );
};

export type ListsItemProps = {
  left: ReactNode;
  right: ReactNode;
  children?: ReactNode;
};

export const ListsItem = (props: ListsItemProps): ReactElement => {
  const t = useMantineTheme();
  const [open, setOpen] = useState(false);
  return (
    <Box
      css={css`
        padding: ${t.spacing.sm}px;
        border-radius: ${t.radius.sm}px;
        color: ${t.colorScheme === "light" ? t.colors.gray[7] : t.colors.dark[0]};

        &:hover {
          background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
        }
      `}
    >
      <Group position="apart">
        <Group spacing="xs">
          {props.children && (
            <ActionIcon color={t.primaryColor} onClick={() => setOpen((v) => !v)}>
              {open ? <TbChevronDown /> : <TbChevronRight />}
            </ActionIcon>
          )}
          {props.left}
        </Group>
        <Group spacing="xs">{props.right}</Group>
      </Group>
      {props.children && (
        <Collapse in={open}>
          <Box
            css={css`
              padding-top: ${t.spacing.sm}px;
              padding-left: ${t.spacing.lg * 2}px;
            `}
          >
            {props.children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export type ListsFieldsProps = {
  data: [string, string][];
};

export const ListsFields = (props: ListsFieldsProps): ReactElement => {
  return (
    <Grid gutter="xs">
      {props.data.map(([key, value], index) => [
        <Grid.Col key={`lists-fields-key-${key}-${index}`} span={2}>
          <Text weight={500} size="sm">
            {key}
          </Text>
        </Grid.Col>,
        <Grid.Col key={`lists-fields-value-${key}-${index}`} span={10}>
          <Text size="sm">{value}</Text>
        </Grid.Col>,
      ])}
    </Grid>
  );
};
