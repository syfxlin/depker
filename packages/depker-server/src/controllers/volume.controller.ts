import { Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { Like } from "typeorm";
import {
  ConnectVolumeRequest,
  ConnectVolumeResponse,
  DeleteVolumeRequest,
  DeleteVolumeResponse,
  DisconnectVolumeRequest,
  DisconnectVolumeResponse,
  GetVolumeRequest,
  GetVolumeResponse,
  ListVolumeRequest,
  ListVolumeResponse,
  UpsertVolumeRequest,
  UpsertVolumeResponse,
} from "../views/volume.view";
import { Volume } from "../entities/volume.entity";
import { Data } from "../decorators/data.decorator";
import { VolumeBind } from "../entities/volume-bind.entity";

@Controller("/volumes")
export class VolumeController {
  @Get("/")
  public async list(@Query() request: ListVolumeRequest): Promise<ListVolumeResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc", all = false } = request;
    const [orderBy, orderAxis] = sort.split(":");
    const [volumes, count] = await Volume.findAndCount({
      relations: {
        binds: true,
      },
      where: {
        name: search ? Like(`%${search}%`) : undefined,
        path: search ? Like(`%${search}%`) : undefined,
      },
      order: {
        [orderBy]: orderAxis ? orderAxis : "asc",
      },
      skip: all ? undefined : offset,
      take: all ? undefined : limit,
    });

    const total: ListVolumeResponse["total"] = count;
    const items: ListVolumeResponse["items"] = volumes.map((i) => ({
      name: i.name,
      global: i.global,
      path: i.path,
      binds: i.binds.map((b) => b.appName),
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    return { total, items };
  }

  @Post("/:name")
  @Put("/:name")
  public async upsert(@Data() request: UpsertVolumeRequest): Promise<UpsertVolumeResponse> {
    const volume = new Volume();
    volume.name = request.name;
    volume.path = request.path;
    volume.global = request.global;

    await Volume.save(volume, { reload: false });
    const savedVolume = await Volume.findOne({
      where: {
        name: volume.name,
      },
      relations: {
        binds: true,
      },
    });

    return await this._wrap(savedVolume!);
  }

  @Get("/:name")
  public async get(@Param() request: GetVolumeRequest): Promise<GetVolumeResponse> {
    const volume = await Volume.findOne({
      where: {
        name: request.name,
      },
      relations: {
        binds: true,
      },
    });
    if (!volume) {
      throw new NotFoundException(`Not found volume of ${request.name}`);
    }
    return await this._wrap(volume);
  }

  @Delete("/:name")
  public async delete(@Param() request: DeleteVolumeRequest): Promise<DeleteVolumeResponse> {
    const result = await Volume.delete(request.name);
    if (!result.affected) {
      throw new NotFoundException(`Not found volume of ${request.name}`);
    }
    return { status: "success" };
  }

  @Post("/:name/connect")
  public async connect(@Data() request: ConnectVolumeRequest): Promise<ConnectVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}`);
    }
    const bind = new VolumeBind();
    bind.bindName = request.name;
    bind.appName = request.app;
    bind.path = request.path;
    bind.readonly = request.readonly;
    await VolumeBind.save(bind);
    return { status: "success" };
  }

  @Delete("/:name/disconnect")
  public async disconnect(@Data() request: DisconnectVolumeRequest): Promise<DisconnectVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}`);
    }
    await VolumeBind.delete({
      bindName: request.name,
      appName: request.app,
    });
    return { status: "success" };
  }

  private async _wrap(volume: Volume): Promise<GetVolumeResponse> {
    return {
      name: volume.name,
      path: volume.path,
      global: volume.global,
      createdAt: volume.createdAt,
      updatedAt: volume.updatedAt,
      binds: volume.binds.map((i) => ({
        name: i.appName,
        path: i.path,
        readonly: i.readonly,
      })),
    };
  }
}
