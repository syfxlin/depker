import { PackContext, PluginContext, RouteContext } from "./plugin.context";

export interface BaseOption<T> {
  type: T;
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
}

export type BooleanOption = BaseOption<"boolean"> & {
  default?: boolean;
  validate?: (value: boolean) => boolean;
};

export type StringOption = BaseOption<"string"> & {
  default?: string;
  validate?: (value: string) => boolean;
};

export type TextOption = BaseOption<"text"> & {
  default?: string;
  validate?: (value: string) => boolean;
};

export type JsonOption = BaseOption<"json"> & {
  default?: string;
  validate?: (value: string) => boolean;
};

export type NumberOption = BaseOption<"number"> & {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  default?: number;
  validate?: (value: number) => boolean;
};

export type ListOption = BaseOption<"list"> & {
  min?: number;
  max?: number;
  default?: string[];
  validate?: (value: string[]) => boolean;
};

export type ObjectOption = BaseOption<"object"> & {
  min?: number;
  max?: number;
  default?: Record<string, string>;
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
        default?: string;
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
        default?: string[];
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
  options?: DepkerPluginOption[];
  init?: (ctx: PluginContext) => Promise<void>;
  destroy?: (ctx: PluginContext) => Promise<void>;
  routes?: (ctx: RouteContext) => Promise<any>;
  buildpack?: {
    options?: DepkerPluginOption[];
    handler?: (ctx: PackContext) => Promise<void>;
  };
}
