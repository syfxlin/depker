import { Input, InputWrapperProps } from "@mantine/core";
import React, { forwardRef, ReactNode } from "react";
import { openModal } from "@mantine/modals";
import { ObjectModal } from "./ObjectModal";

export type ObjectInputProps = Omit<InputWrapperProps, "children" | "onChange"> & {
  icon?: ReactNode;
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  modals: (value: Record<string, any>, setValue: (value: Record<string, any>) => void) => Array<ReactNode>;
};

export const ObjectInput = forwardRef<HTMLDivElement, ObjectInputProps>(
  ({ icon, placeholder, value, onChange, modals, ...props }, ref) => {
    return (
      <Input.Wrapper {...props} ref={ref}>
        <Input
          readOnly
          icon={icon}
          placeholder={placeholder}
          value={Object.entries(value ?? {})
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")}
          onClick={() => {
            openModal({
              title: <>Edit {props.label}</>,
              children: (
                <ObjectModal value={value} onChange={onChange}>
                  {modals}
                </ObjectModal>
              ),
            });
          }}
        />
      </Input.Wrapper>
    );
  }
);
