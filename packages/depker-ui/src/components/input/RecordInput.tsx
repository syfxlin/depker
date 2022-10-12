import React, { ChangeEvent, forwardRef, ReactNode, useEffect, useState } from "react";
import { ActionIcon, Button, Grid, Group, Input, InputWrapperProps, Stack, useMantineTheme } from "@mantine/core";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";
import { dequal } from "dequal";

export type RecordInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
  value: Array<[string, string]>;
  onChange: (value: Array<[string, string]>) => void;
};

export const RecordInput = forwardRef<HTMLDivElement, RecordInputProps>(
  ({ leftIcon, rightIcon, leftPlaceholder, rightPlaceholder, value, onChange, ...props }, ref) => {
    const t = useMantineTheme();
    const [data, setData] = useState(value);
    useEffect(() => {
      if (!dequal(data, value)) {
        onChange(data);
      }
    }, [data, value, onChange]);
    return (
      <Input.Wrapper {...props} ref={ref}>
        <Stack spacing="xs">
          {!data.length && (
            <Grid>
              <Grid.Col span={6}>
                <Input disabled icon={leftIcon} placeholder={leftPlaceholder} />
              </Grid.Col>
              <Grid.Col span={6}>
                <Input disabled icon={rightIcon} placeholder={rightPlaceholder} />
              </Grid.Col>
            </Grid>
          )}
          {data.map((item, index) => (
            <Grid key={`record-input-${index}`}>
              <Grid.Col span={6}>
                <Input
                  icon={leftIcon}
                  placeholder={leftPlaceholder}
                  value={item[0]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const values = [...data];
                    values[index] = [e.target.value, item[1]];
                    setData(values);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Input
                  icon={rightIcon}
                  placeholder={rightPlaceholder}
                  value={item[1]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const values = [...data];
                    values[index] = [item[0], e.target.value];
                    setData(values);
                  }}
                  rightSection={
                    <ActionIcon
                      onClick={() => {
                        const values = [...data];
                        values.splice(index, 1);
                        setData(values);
                      }}
                    >
                      <TbX />
                    </ActionIcon>
                  }
                />
              </Grid.Col>
            </Grid>
          ))}
          <Group spacing={t.spacing.xs}>
            <Button size="xs" variant="light" leftIcon={<TbCodePlus />} onClick={() => setData([...data, ["", ""]])}>
              Add
            </Button>
            <Button size="xs" variant="light" leftIcon={<TbCodeMinus />} onClick={() => setData([])}>
              Clear
            </Button>
          </Group>
        </Stack>
      </Input.Wrapper>
    );
  }
);
