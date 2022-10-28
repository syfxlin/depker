import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Input,
  InputWrapperProps,
  Select,
  SelectProps,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import React, { ForwardedRef, forwardRef, PropsWithoutRef, ReactNode } from "react";
import { useFilterState } from "../../hooks/use-filter-state";
import { css } from "@emotion/react";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";

export type SelectDataItem = {
  value: string;
  label: string;
  description: string;
};

export type SelectArrayInputProps<T> = Omit<InputWrapperProps, "children" | "onChange"> & {
  icon?: ReactNode;
  placeholder?: string;
  value?: Array<T>;
  onChange?: (value: Array<T>) => void;
  items: Array<SelectDataItem>;
  select: (value: T | undefined, setValue: (value: T | undefined) => void) => Partial<SelectProps>;
  modals: (value: T | undefined, setValue: (value: T | undefined) => void) => Array<ReactNode>;
};

const SelectArrayInputInner = <T,>(
  { icon, placeholder, value, onChange, items, select, modals, ...props }: SelectArrayInputProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const t = useMantineTheme();
  // @ts-ignore
  const [data, setData] = useFilterState<T | undefined>(value ?? [], onChange ?? (() => {}), (v) => v);
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
        {!data.length && (
          <Grid>
            <Grid.Col span={12}>
              <Input disabled icon={icon} placeholder={placeholder} />
            </Grid.Col>
          </Grid>
        )}
        {data.map((item, index) => {
          const setItem = (value: T | undefined) => {
            const values = [...data];
            values[index] = value;
            setData(values);
          };
          return (
            <Grid key={`selected-array-input-${index}`}>
              <Grid.Col span={4}>
                <Select
                  data={items}
                  {...select(item, setItem)}
                  creatable
                  searchable
                  icon={icon}
                  placeholder={placeholder}
                  getCreateLabel={(query) => <Text color={t.primaryColor}>+ Create {query}</Text>}
                  itemComponent={forwardRef(({ label, description, ...props }, ref) => (
                    <Box {...props} ref={ref}>
                      <Text size="sm">{label}</Text>
                      <Text size="xs">{description}</Text>
                    </Box>
                  ))}
                  rightSection={
                    <Tooltip label="Delete">
                      <ActionIcon
                        onClick={() => {
                          const values = [...data];
                          values.splice(index, 1);
                          setData(values);
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
          <Button size="xs" variant="light" leftIcon={<TbCodePlus />} onClick={() => setData([...data, undefined])}>
            Add
          </Button>
          <Button size="xs" variant="light" leftIcon={<TbCodeMinus />} onClick={() => setData([])}>
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