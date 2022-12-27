import {
  All,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Data } from "../decorators/data.decorator";
import {
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginRequest,
  ListPluginResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
} from "../views/plugin.view";
import { PluginService } from "../services/plugin.service";
import { RouteContext } from "../plugins/route.context";
import { ModuleRef } from "@nestjs/core";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PluginEvent } from "../events/plugin.event";

@Controller("/api/plugins")
export class PluginController {
  constructor(
    private readonly plugins: PluginService,
    private readonly events: EventEmitter2,
    private readonly ref: ModuleRef
  ) {}

  @Get("/")
  public async list(@Data() request: ListPluginRequest): Promise<ListPluginResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:desc" } = request;
    const plugins = Object.values(await this.plugins.plugins());

    const total: ListPluginResponse["total"] = plugins.length;
    const items: ListPluginResponse["items"] = plugins
      .filter((p) => {
        const lower = search.toLowerCase();
        if (!lower) {
          return true;
        }
        if (p.name.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        if (p.label && p.label.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        if (p.group && p.group.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        return false;
      })
      .sort((left, right) => {
        const [by, order] = sort.toLowerCase().split(":");
        const a = order === "asc" ? left : right;
        const b = order === "asc" ? left : right;
        if (by === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      })
      .slice(offset, offset + limit)
      .map((p) => ({
        name: p.name,
        label: p.label,
        group: p.group,
        icon: p.icon,
      }));

    return { total, items };
  }

  @Post("/:pkg")
  public async install(@Data() request: InstallPluginRequest): Promise<InstallPluginResponse> {
    const success = await this.plugins.install(request.pkg);
    if (success) {
      return { status: "success" };
    } else {
      throw new InternalServerErrorException(`Install plugin ${request.pkg} failed.`);
    }
  }

  @Delete("/:pkg")
  public async uninstall(@Data() request: UninstallPluginRequest): Promise<UninstallPluginResponse> {
    const success = await this.plugins.uninstall(request.pkg);
    if (success) {
      return { status: "success" };
    } else {
      throw new InternalServerErrorException(`Uninstall plugin ${request.pkg} failed.`);
    }
  }

  @All("/routes/:name/:path")
  public async routes(
    @Param("name") name: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const plugins = await this.plugins.plugins();
    const plugin = plugins[name];
    if (!plugin || !plugin.routes) {
      throw new NotFoundException(`Not found plugin routes of ${name}`);
    }
    const context = new RouteContext({ name, request, response, ref: this.ref });
    await this.events.emitAsync(PluginEvent.PRE_ROUTES, plugin, context);
    const result = await plugin.routes(context);
    await this.events.emitAsync(PluginEvent.POST_ROUTES, plugin, context, result);
    return result;
  }
}
