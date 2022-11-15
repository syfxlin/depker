import {
  ActionIcon,
  Button,
  Grid,
  Group,
  Input,
  InputWrapperProps,
  Select,
  SelectItem,
  SelectProps,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import React, { ForwardedRef, forwardRef, PropsWithoutRef, ReactNode } from "react";
import { useFilterState } from "../../hooks/use-filter-state";
import { css } from "@emotion/react";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";

export type SelectArrayInputProps<T> = Omit<InputWrapperProps, "children" | "onChange"> & {
  icon?: ReactNode;
  placeholder?: string;
  value?: Array<T>;
  onChange?: (value: Array<T>) => void;
  items: Array<SelectItem>;
  select: (value: T | undefined, setValue: (value: T | undefined) => void) => Partial<SelectProps>;
  modals: (value: T | undefined, setValue: (value: T | undefined) => void) => Array<ReactNode>;
};

const SelectArrayInputInner = <T,>(
  { icon, placeholder, value, onChange, items, select, modals, ...props }: SelectArrayInputProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const t = useMantineTheme();
  // @ts-ignore
  const data = useFilterState<T | undefined>(value ?? [], onChange ?? (() => {}), (v) => v);
  return (
    <Input.Wrapper {...props} ref={ref}>
      <Stack
        spacing="xs"
        css={css`
          .mantine-Input-wrapper {
            margin-top: calc(${t.spacing.xs}px / 2);
          }
        `}
      >
        {!data.value.length && (
          <Grid>
            <Grid.Col span={12}>
              <Input disabled icon={icon} placeholder={placeholder} />
            </Grid.Col>
          </Grid>
        )}
        {data.value.map((item, index) => {
          const setItem = (value: T | undefined) => {
            const values = [...data.value];
            values[index] = value;
            data.update(values);
          };
          return (
            <Grid key={`selected-array-input-${index}`}>
              <Grid.Col span={4}>
                <Select
                  data={items}
                  {...select(item, setItem)}
                  searchable
                  icon={icon}
                  placeholder={placeholder}
                  rightSection={
                    <Tooltip label="Delete">
                      <ActionIcon
                        onClick={() => {
                          const values = [...data.value];
                          values.splice(index, 1);
                          data.update(values);
                        }}
                      >
                        <TbX />
                      </ActionIcon>
                    </Tooltip>
                  }
                />
              </Grid.Col>
              {modals(item, setItem).map((value, index, array) => (
                <Grid.Col key={`select-array-input-item-${index}`} span={8 / array.length}>
                  {value}
                </Grid.Col>
              ))}
            </Grid>
          );
        })}
        <Group spacing={t.spacing.xs}>
          <Button
            size="xs"
            variant="light"
            leftIcon={<TbCodePlus />}
            onClick={() => data.update([...data.value, undefined])}
          >
            Add
          </Button>
          <Button size="xs" variant="light" leftIcon={<TbCodeMinus />} onClick={() => data.update([])}>
            Clear
          </Button>
        </Group>
      </Stack>
    </Input.Wrapper>
  );
};

export const SelectArrayInput = forwardRef(SelectArrayInputInner) as <T>(
  props: PropsWithoutRef<SelectArrayInputProps<T>>
) => ReturnType<typeof SelectArrayInputInner>;
