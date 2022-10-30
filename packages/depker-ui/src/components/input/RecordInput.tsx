import React, { ChangeEvent, forwardRef, ReactNode } from "react";
import {
  ActionIcon,
  Button,
  Grid,
  Group,
  Input,
  InputWrapperProps,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";
import { useFilterState } from "../../hooks/use-filter-state";

export type RecordInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
  value?: Array<[string, string]>;
  onChange?: (value: Array<[string, string]>) => void;
};

export const RecordInput = forwardRef<HTMLDivElement, RecordInputProps>(
  ({ leftIcon, rightIcon, leftPlaceholder, rightPlaceholder, value, onChange, ...props }, ref) => {
    const t = useMantineTheme();
    const data = useFilterState(value ?? [], onChange ?? (() => {}), ([k]) => k);
    return (
      <Input.Wrapper {...props} ref={ref}>
        <Stack spacing="xs">
          {!data.value.length && (
            <Grid>
              <Grid.Col span={6}>
                <Input disabled icon={leftIcon} placeholder={leftPlaceholder} />
              </Grid.Col>
              <Grid.Col span={6}>
                <Input disabled icon={rightIcon} placeholder={rightPlaceholder} />
              </Grid.Col>
            </Grid>
          )}
          {data.value.map((item, index) => (
            <Grid key={`record-input-${index}`}>
              <Grid.Col span={6}>
                <Input
                  icon={leftIcon}
                  placeholder={leftPlaceholder}
                  value={item[0] ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const values = [...data.value];
                    values[index] = [e.target.value, item[1]];
                    data.update(values);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Input
                  icon={rightIcon}
                  placeholder={rightPlaceholder}
                  value={item[1] ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const values = [...data.value];
                    values[index] = [item[0], e.target.value];
                    data.update(values);
                  }}
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
            </Grid>
          ))}
          <Group spacing={t.spacing.xs}>
            <Button
              size="xs"
              variant="light"
              leftIcon={<TbCodePlus />}
              onClick={() => data.update([...data.value, ["", ""]])}
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
  }
);
