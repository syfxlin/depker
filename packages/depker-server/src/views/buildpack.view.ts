import { DepkerPluginOption } from "../plugins/plugin.types";

export type ListBuildPackResponse = Array<{
  name: string;
  label?: string;
  group?: string;
  icon?: string;
  options?: DepkerPluginOption[];
}>;
