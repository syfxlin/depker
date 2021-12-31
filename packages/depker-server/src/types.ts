import Router from "@koa/router";
import Koa from "koa";
import { WebSocket } from "ws";

export type KoaFn = (router: Router, app: Koa) => void;

declare module "koa" {
  interface DefaultContext {
    ws?: () => Promise<WebSocket>;
  }
}
