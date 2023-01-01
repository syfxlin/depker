import { PackContext } from "./pack.context";
import { PluginContext } from "./plugin.context";
import { RouteContext } from "./route.context";

export interface BaseOption<T, E> {
  type: T;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  validate?: (value: E) => string | null | undefined | Promise<string | null | undefined>;
}

export type BooleanOption = BaseOption<"boolean", boolean>;

export type StringOption = BaseOption<"string", string>;

export type TextOption = BaseOption<"text", string>;

export type JsonOption = BaseOption<"json", string>;

export type NumberOption = BaseOption<"number", number> & {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
};

export type ListOption = BaseOption<"list", string[]>;

export type ObjectOption = BaseOption<"object", Record<string, string>>;

export type SelectOption = BaseOption<"select", string | string[]> &
  (
    | {
        options: Array<{
          label: string;
          value: string;
        }>;
        multiple?: false;
      }
    | {
        options: Array<{
          label: string;
          value: string;
        }>;
        multiple: true;
        min?: number;
        max?: number;
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

export interface LoadedDepkerPlugin extends DepkerPlugin {
  pkg: string;
  dir: string;
}
