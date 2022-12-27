import { DepkerPlugin } from "../plugins/plugin.types";
import { SpawnSyncReturns } from "child_process";
import { RouteContext } from "../plugins/route.context";

export enum PluginEvent {
  PRE_INIT = "plugin.pre_init",
  POST_INIT = "plugin.post_init",
  PRE_DESTROY = "plugin.pre_destroy",
  POST_DESTROY = "plugin.post_destroy",
  PRE_LOAD = "plugin.pre_load",
  POST_LOAD = "plugin.post_load",
  PRE_INSTALL = "plugin.pre_install",
  POST_INSTALL = "plugin.post_install",
  PRE_UNINSTALL = "plugin.pre_uninstall",
  POST_UNINSTALL = "plugin.post_uninstall",
  PRE_ROUTES = "plugin.pre_routes",
  POST_ROUTES = "plugin.post_routes",
}

export type PluginEventHandler = {
  [PluginEvent.PRE_INIT]: () => any;
  [PluginEvent.POST_INIT]: () => any;
  [PluginEvent.PRE_DESTROY]: () => any;
  [PluginEvent.POST_DESTROY]: () => any;
  [PluginEvent.PRE_LOAD]: (pkg: string) => any;
  [PluginEvent.POST_LOAD]: (pkg: string, plugin: DepkerPlugin) => any;
  [PluginEvent.PRE_INSTALL]: (pkg: string) => any;
  [PluginEvent.POST_INSTALL]: (pkg: string, returns: SpawnSyncReturns<Buffer>) => any;
  [PluginEvent.PRE_UNINSTALL]: (pkg: string) => any;
  [PluginEvent.POST_UNINSTALL]: (pkg: string, returns: SpawnSyncReturns<Buffer>) => any;
  [PluginEvent.PRE_ROUTES]: (plugin: DepkerPlugin, context: RouteContext) => any;
  [PluginEvent.POST_ROUTES]: (plugin: DepkerPlugin, context: RouteContext, result: any) => any;
};
