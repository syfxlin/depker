import React, { ReactNode, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { closeAllModals } from "@mantine/modals";

export type ObjectModalProps = {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => boolean | Promise<boolean>;
  children: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectModal: React.FC<ObjectModalProps> = (props) => {
  const [value, setValue] = useState<Record<string, any>>(props.value ?? {});
  const [loading, setLoading] = useState(false);
  return (
    <Stack>
      {props.children(value, setValue)}
      <Button
        mt="xs"
        fullWidth
        loading={loading}
        onClick={async () => {
          setLoading(true);
          if (await props.onChange?.(value)) {
            closeAllModals();
          }
          setLoading(false);
        }}
      >
        Save
      </Button>
    </Stack>
  );
};
