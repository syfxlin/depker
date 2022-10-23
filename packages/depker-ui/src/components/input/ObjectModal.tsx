import React, { ReactNode, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { closeAllModals } from "@mantine/modals";

export type ObjectModalProps = {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  children: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectModal: React.FC<ObjectModalProps> = (props) => {
  const [value, setValue] = useState<Record<string, any>>(props.value ?? {});
  return (
    <Stack>
      {props.children(value, setValue)}
      <Button
        mt="xs"
        fullWidth
        onClick={() => {
          props.onChange?.(value);
          closeAllModals();
        }}
      >
        Save
      </Button>
    </Stack>
  );
};
