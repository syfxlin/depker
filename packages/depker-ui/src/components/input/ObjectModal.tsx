import React, { ReactNode, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { closeAllModals } from "@mantine/modals";
import { useCalling, UseCallingActions } from "../../hooks/use-calling";

export type ObjectModalProps = {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>, actions: UseCallingActions) => boolean | Promise<boolean>;
  children: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectModal: React.FC<ObjectModalProps> = (props) => {
  const [value, setValue] = useState<Record<string, any>>(props.value ?? {});
  const calling = useCalling();
  return (
    <Stack>
      {props.children(value, setValue)}
      <Button
        mt="xs"
        fullWidth
        loading={calling.loading}
        onClick={() => {
          calling.calling(async (actions) => {
            if (await props.onChange?.(value, actions)) {
              closeAllModals();
            }
          });
        }}
      >
        Save
      </Button>
    </Stack>
  );
};
