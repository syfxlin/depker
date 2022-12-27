import { Request, Response } from "express";
import { PluginContext, PluginOptions } from "./plugin.context";

export interface RouteOptions extends PluginOptions {
  request: Request;
  response: Response;
}

export class RouteContext extends PluginContext {
  public readonly method: string;
  public readonly path: string;
  public readonly request: Request;
  public readonly response: Response;

  constructor(options: RouteOptions) {
    super(options);
    this.method = options.request.method;
    this.path = options.request.params.path;
    this.request = options.request;
    this.response = options.response;
  }
}
