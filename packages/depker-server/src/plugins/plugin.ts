import PluginCtx from "./ctx";
import { Socket } from "socket.io";

export type DepkerPlugin = {
  init?: (ctx: PluginCtx) => Promise<void>;
  started?: (ctx: PluginCtx) => Promise<void>;
  routes?: (socket: Socket, ctx: PluginCtx) => Promise<void>;
};
