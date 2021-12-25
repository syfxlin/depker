import PluginCtx from "./ctx";
import { Socket } from "socket.io";

export type DepkerPlugin = {
  register?: (ctx: PluginCtx) => Promise<void>;
  routes?: (socket: Socket, ctx: PluginCtx) => Promise<void>;
};
