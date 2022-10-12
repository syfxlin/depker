import React, { ChangeEvent, forwardRef, ReactNode } from "react";
import { ActionIcon, Button, Group, Input, InputWrapperProps, Stack, useMantineTheme } from "@mantine/core";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";

export type ArrayInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  icon?: ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
};

export const ArrayInput = forwardRef<HTMLDivElement, ArrayInputProps>(
  ({ icon, placeholder, value, onChange, ...props }, ref) => {
    const t = useMantineTheme();
    return (
      <Input.Wrapper {...props} ref={ref}>
        <Stack spacing="xs">
          {!value.length && <Input disabled icon={icon} placeholder={placeholder} />}
          {value.map((item, index) => (
            <Input
              key={`array-input-${index}`}
              value={item}
              icon={icon}
              placeholder={placeholder}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const values = [...value];
                values[index] = e.target.value;
                onChange(values);
              }}
              rightSection={
                <ActionIcon
                  onClick={() => {
                    const values = [...value];
                    values.splice(index, 1);
                    onChange(values);
                  }}
                >
                  <TbX />
                </ActionIcon>
              }
            />
          ))}
          <Group spacing={t.spacing.xs}>
            <Button size="xs" variant="light" leftIcon={<TbCodePlus />} onClick={() => onChange([...value, ""])}>
              Add
            </Button>
            <Button size="xs" variant="light" leftIcon={<TbCodeMinus />} onClick={() => onChange([])}>
              Clear
            </Button>
          </Group>
        </Stack>
      </Input.Wrapper>
    );
  }
);
