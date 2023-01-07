import React, { ChangeEvent, forwardRef } from "react";
import {
  BooleanOption,
  DepkerPluginOption,
  JsonOption,
  ListOption,
  NumberOption,
  ObjectOption,
  SelectOption,
  StringOption,
  TextOption,
} from "@syfxlin/depker-client";
import { Input, JsonInput, MultiSelect, NumberInput, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { TbCode, TbEdit, TbEqual, TbList, TbListNumbers, TbNote, TbSelect, TbStack } from "react-icons/all";
import { ArrayInput } from "./ArrayInput";
import { RecordInput } from "./RecordInput";

type ExtensionOptionProps<T, O> = {
  option: O;
  value?: T | undefined;
  onChange?: (value: T | undefined) => void;
};

const BooleanOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<boolean, BooleanOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <Select
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        icon={<TbSelect />}
        clearable
        value={typeof value === "boolean" ? (value ? "true" : "false") : undefined}
        onChange={(value) => onChange?.(value ? value === "true" : undefined)}
        data={[
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ]}
        {...props}
        ref={ref}
      />
    );
  }
);

const StringOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<string, StringOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <TextInput
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        icon={<TbEdit />}
        value={value ?? ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value ? e.target.value : undefined)}
        {...props}
        ref={ref}
      />
    );
  }
);

const TextOpt = forwardRef<HTMLTextAreaElement, ExtensionOptionProps<string, TextOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <Textarea
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        icon={<TbNote />}
        value={value ?? ""}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value ? e.target.value : undefined)}
        autosize
        minRows={2}
        maxRows={5}
        {...props}
        ref={ref}
      />
    );
  }
);

const JsonOpt = forwardRef<HTMLTextAreaElement, ExtensionOptionProps<string, JsonOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <JsonInput
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        icon={<TbCode />}
        value={value ?? ""}
        onChange={(value) => onChange?.(value ? value : undefined)}
        autosize
        minRows={2}
        maxRows={5}
        {...props}
        ref={ref}
      />
    );
  }
);

const NumberOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<number, NumberOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <NumberInput
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        min={option.min}
        max={option.max}
        step={option.step}
        precision={option.precision}
        icon={<TbListNumbers />}
        value={value}
        onChange={(value) => onChange?.(value)}
        {...props}
        ref={ref}
      />
    );
  }
);

const ListOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<string[], ListOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <ArrayInput
        label={option.label ?? option.name}
        description={option.description}
        placeholder={option.placeholder}
        required={option.required}
        icon={<TbList />}
        value={value}
        onChange={(value) => onChange?.(value.length ? value : undefined)}
        {...props}
        ref={ref}
      />
    );
  }
);

const ObjectOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<Record<string, string>, ObjectOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    return (
      <RecordInput
        label={option.label ?? option.name}
        description={option.description}
        required={option.required}
        leftIcon={<TbList />}
        rightIcon={<TbEqual />}
        leftPlaceholder={option.placeholder}
        rightPlaceholder={option.placeholder}
        value={value ? Object.entries(value) : undefined}
        onChange={(value) => onChange?.(value.length ? value.reduce((a, [k, v]) => ({ ...a, [k]: v }), {}) : undefined)}
        {...props}
        ref={ref}
      />
    );
  }
);

const SelectOpt = forwardRef<HTMLInputElement, ExtensionOptionProps<string | string[], SelectOption>>(
  ({ value, onChange, option, ...props }, ref) => {
    if (!option.multiple) {
      return (
        <Select
          label={option.label ?? option.name}
          description={option.description}
          placeholder={option.placeholder}
          required={option.required}
          icon={<TbSelect />}
          clearable
          searchable
          nothingFound="No Options"
          value={value as string}
          onChange={(value) => onChange?.(value ?? undefined)}
          data={option.options}
          {...props}
          ref={ref}
        />
      );
    } else {
      return (
        <MultiSelect
          label={option.label ?? option.name}
          description={option.description}
          placeholder={option.placeholder}
          required={option.required}
          icon={<TbSelect />}
          clearable
          searchable
          nothingFound="No Options"
          value={value as string[]}
          onChange={(value) => onChange?.(value.length ? value : undefined)}
          data={option.options}
          {...props}
          ref={ref}
        />
      );
    }
  }
);

export type ExtensionInputProps = {
  options?: DepkerPluginOption[];
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
};

export const ExtensionInput = forwardRef<HTMLDivElement, ExtensionInputProps>(
  ({ options, value, onChange, ...props }, ref) => {
    if (!options) {
      return (
        <Stack>
          <Input disabled icon={<TbStack />} placeholder="No Options" />
        </Stack>
      );
    }
    return (
      <Stack {...props} ref={ref}>
        {options.map((option) => {
          if (option.type === "boolean") {
            return (
              <BooleanOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "string") {
            return (
              <StringOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "text") {
            return (
              <TextOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "json") {
            return (
              <JsonOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "number") {
            return (
              <NumberOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "list") {
            return (
              <ListOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "object") {
            return (
              <ObjectOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          if (option.type === "select") {
            return (
              <SelectOpt
                key={`input:extension:${option.name}`}
                option={option}
                value={value?.[option.name]}
                onChange={(v) => onChange?.({ ...value, [option.name]: v })}
              />
            );
          }
          return null;
        })}
      </Stack>
    );
  }
);
