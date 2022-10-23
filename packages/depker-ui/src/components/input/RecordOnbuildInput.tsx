import React, { ChangeEvent, forwardRef, ReactNode } from "react";
import {
  ActionIcon,
  Button,
  Grid,
  Group,
  Input,
  InputWrapperProps,
  Select,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { TbBox, TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";
import { css } from "@emotion/react";
import { useFilterState } from "../../hooks/use-filter-state";

export type RecordOnbuildInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
  value?: Array<[string, string, boolean]>;
  onChange?: (value: Array<[string, string, boolean]>) => void;
};

export const RecordOnbuildInput = forwardRef<HTMLDivElement, RecordOnbuildInputProps>(
  ({ leftIcon, rightIcon, leftPlaceholder, rightPlaceholder, value, onChange, ...props }, ref) => {
    const t = useMantineTheme();
    const [data, setData] = useFilterState(value ?? [], onChange ?? (() => {}), ([k]) => k);
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
                    values[index] = [e.target.value, item[1], item[2]];
                    setData(values);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Input
                  icon={rightIcon}
                  placeholder={rightPlaceholder}
                  value={item[1]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const values = [...data];
                    values[index] = [item[0], e.target.value, item[2]];
                    setData(values);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Select
                  icon={<TbBox />}
                  placeholder="On Build"
                  value={item[2] ? "true" : "false"}
                  data={[
                    { label: "On Build: Yes", value: "true" },
                    { label: "On Build: No", value: "false" },
                  ]}
                  onChange={(v) => {
                    const values = [...data];
                    values[index] = [item[0], item[1], v === "true"];
                    setData(values);
                  }}
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
                  css={css`
                    position: relative;
                    margin-top: calc(${t.spacing.xs}px / 2);
                  `}
                />
              </Grid.Col>
            </Grid>
          ))}
          <Group spacing={t.spacing.xs}>
            <Button
              size="xs"
              variant="light"
              leftIcon={<TbCodePlus />}
              onClick={() => setData([...data, ["", "", false]])}
            >
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
