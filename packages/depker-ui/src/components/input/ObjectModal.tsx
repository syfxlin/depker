import React, { ReactNode, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { closeAllModals } from "@mantine/modals";
import { useLoading } from "../../hooks/use-loading";

export type ObjectModalProps = {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => boolean | Promise<boolean>;
  children: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectModal: React.FC<ObjectModalProps> = (props) => {
  const [value, setValue] = useState<Record<string, any>>(props.value ?? {});
  const loading = useLoading();
  return (
    <Stack>
      {props.children(value, setValue)}
      <Button
        mt="xs"
        fullWidth
        loading={loading.value}
        onClick={async () => {
          loading.set(true);
          if (await props.onChange?.(value)) {
            closeAllModals();
          }
          loading.set(false);
        }}
      >
        Save
      </Button>
    </Stack>
  );
};
