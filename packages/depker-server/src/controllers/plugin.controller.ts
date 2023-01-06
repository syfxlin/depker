import { All, Controller, Delete, Get, NotFoundException, Param, Post, Put, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { Data } from "../decorators/data.decorator";
import {
  GetPluginSettingRequest,
  GetPluginSettingResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginRequest,
  ListPluginResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
  UpdatePluginSettingRequest,
  UpdatePluginSettingResponse,
} from "../views/plugin.view";
import { PluginService } from "../services/plugin.service";
import { RouteContext } from "../plugins/route.context";
import { ModuleRef } from "@nestjs/core";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PluginEvent } from "../events/plugin.event";
import { Setting } from "../entities/setting.entity";

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

    const filtered = plugins.filter((p) => {
      const lower = search.toLowerCase();
      if (!lower) {
        return true;
      }
      const fields = [p.name, p.label, p.group];
      return fields.find((f) => (f ?? "").toLowerCase().indexOf(lower) !== -1);
    });

    const total: ListPluginResponse["total"] = filtered.length;
    const items: ListPluginResponse["items"] = filtered
      .sort((left, right) => {
        const [by, order] = sort.toLowerCase().split(":");
        const a = order === "asc" ? left : right;
        const b = order === "asc" ? right : left;
        if (by === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      })
      .slice(offset, offset + limit)
      .map((p) => ({
        pkg: p.pkg,
        name: p.name,
        label: p.label,
        group: p.group,
        icon: p.icon,
        buildpack: !!p.buildpack,
        options: !!p.options,
      }));

    return { total, items };
  }

  @Post("/:name")
  public async install(@Data() request: InstallPluginRequest): Promise<InstallPluginResponse> {
    await this.plugins.install(request.name);
    return { status: "success" };
  }

  @Delete("/:name")
  public async uninstall(@Data() request: UninstallPluginRequest): Promise<UninstallPluginResponse> {
    await this.plugins.uninstall(request.name);
    return { status: "success" };
  }

  @Get("/settings/:name")
  public async get(@Data() request: GetPluginSettingRequest): Promise<GetPluginSettingResponse> {
    const plugins = await this.plugins.plugins();
    const plugin = plugins[request.name];
    if (!plugin || !plugin.options) {
      throw new NotFoundException(`Not found plugin global options of ${request.name}`);
    }
    const setting = await Setting.read();
    return {
      options: plugin.options,
      values: setting.plugins[plugin.name] ?? {},
    };
  }

  @Put("/settings/:name")
  public async set(@Data() request: UpdatePluginSettingRequest): Promise<UpdatePluginSettingResponse> {
    const plugins = await this.plugins.plugins();
    const plugin = plugins[request.name];
    if (!plugin || !plugin.options) {
      throw new NotFoundException(`Not found plugin global options of ${request.name}`);
    }
    await this.plugins.validate(plugin.options, request.values);
    const setting = await Setting.read();
    await this.events.emitAsync(PluginEvent.PRE_SETTING, plugin, setting.plugins[plugin.name] ?? {});
    setting.plugins[plugin.name] = request.values;
    await Setting.write(setting);
    await this.events.emitAsync(PluginEvent.POST_SETTING, plugin, setting.plugins[plugin.name] ?? {});
    return {
      options: plugin.options,
      values: setting.plugins[plugin.name] ?? {},
    };
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
    const context = new RouteContext({ plugin, request, response, ref: this.ref });
    await this.events.emitAsync(PluginEvent.PRE_ROUTE, plugin, context);
    const result = await plugin.routes(context);
    await this.events.emitAsync(PluginEvent.POST_ROUTE, plugin, context, result);
    return result;
  }
}
