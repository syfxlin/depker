import { ServerConfig } from "../config/config";
import { dir } from "../config/dir";
import Loki from "lokijs";
import EventEmitter from "eventemitter3";
import { Logger } from "pino";
import { Docker } from "../docker/api";

export type PluginProps = {
  config: ServerConfig;
  database: Loki;
  dir: typeof dir;
  events: EventEmitter;
  docker: Docker;
  logger: Logger;
};

export default class PluginCtx {
  public readonly config: ServerConfig;
  public readonly database: Loki;
  public readonly dir: typeof dir;
  public readonly events: EventEmitter;
  public readonly docker: Docker;
  public readonly logger: Logger;

  constructor(props: PluginProps) {
    this.config = props.config;
    this.database = props.database;
    this.dir = props.dir;
    this.events = props.events;
    this.docker = props.docker;
    this.logger = props.logger;
  }
}
