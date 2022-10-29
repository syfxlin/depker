import { ActionIcon, Button, Group, Input, InputWrapperProps, Stack, useMantineTheme } from "@mantine/core";
import React, { forwardRef, ReactNode } from "react";
import { TbCodeMinus, TbCodePlus, TbX } from "react-icons/all";
import { openModal } from "@mantine/modals";
import { ObjectModal } from "./ObjectModal";

export type ObjectArrayInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  icon?: ReactNode;
  value: Array<Record<string, any>>;
  onChange: (value: Array<Record<string, any>>) => void;
  children: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectArrayInput = forwardRef<HTMLDivElement, ObjectArrayInputProps>(
  ({ icon, placeholder, value, onChange, children, ...props }, ref) => {
    const t = useMantineTheme();
    return (
      <Input.Wrapper {...props} ref={ref}>
        <Stack spacing="xs">
          {!value.length && <Input disabled icon={icon} placeholder={placeholder} />}
          {value.map((item, index) => (
            <Input
              key={`object-array-input-${index}`}
              readOnly
              icon={icon}
              placeholder={placeholder}
              value={Object.entries(item)
                .map(([k, v]) => `${k}: ${v}`)
                .join("; ")}
              onClick={() => {
                openModal({
                  title: <>Edit {props.label} Item</>,
                  children: (
                    <ObjectModal
                      value={item}
                      onChange={(item) => {
                        const values = [...value];
                        values[index] = item;
                        onChange(values);
                      }}
                    >
                      {children}
                    </ObjectModal>
                  ),
                });
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
            <Button size="xs" variant="light" leftIcon={<TbCodePlus />} onClick={() => onChange([...value, {}])}>
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
