import { PackContext } from "./pack.context";
import { PluginContext } from "./plugin.context";
import { RouteContext } from "./route.context";

export interface BaseOption<T> {
  type: T;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

export type BooleanOption = BaseOption<"boolean"> & {
  validate?: (value: boolean) => boolean;
};

export type StringOption = BaseOption<"string"> & {
  validate?: (value: string) => boolean;
};

export type TextOption = BaseOption<"text"> & {
  validate?: (value: string) => boolean;
};

export type JsonOption = BaseOption<"json"> & {
  validate?: (value: string) => boolean;
};

export type NumberOption = BaseOption<"number"> & {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  validate?: (value: number) => boolean;
};

export type ListOption = BaseOption<"list"> & {
  validate?: (value: string[]) => boolean;
};

export type ObjectOption = BaseOption<"object"> & {
  validate?: (value: Record<string, string>) => boolean;
};

export type SelectOption = BaseOption<"select"> &
  (
    | {
        options: Array<{
          label: string;
          value: string;
        }>;
        multiple?: false;
        validate?: (value: string) => boolean;
      }
    | {
        options: Array<{
          label: string;
          value: string;
        }>;
        multiple: true;
        min?: number;
        max?: number;
        validate?: (value: string[]) => boolean;
      }
  );

export type DepkerPluginOption =
  | BooleanOption
  | StringOption
  | TextOption
  | JsonOption
  | NumberOption
  | ListOption
  | ObjectOption
  | SelectOption;

export interface DepkerPlugin {
  name: string;
  label?: string;
  group?: string;
  icon?: string;
  options?: DepkerPluginOption[];
  init?: (ctx: PluginContext) => Promise<void> | void;
  destroy?: (ctx: PluginContext) => Promise<void> | void;
  routes?: (ctx: RouteContext) => Promise<any> | any;
  buildpack?: {
    options?: DepkerPluginOption[];
    handler?: (ctx: PackContext) => Promise<void> | void;
  };
}
