import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
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
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";

@Controller("/api/volumes")
export class VolumeController {
  private readonly logger = new Logger(VolumeController.name);

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
      createdAt: i.createdAt.getTime(),
      updatedAt: i.updatedAt.getTime(),
    }));

    return { total, items };
  }

  @Post("/")
  public async create(@Body() request: UpsertVolumeRequest): Promise<UpsertVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found volume of ${request.name}.`);
    }
    await Volume.insert({
      name: request.name,
      path: request.path,
      global: request.global,
    });
    return this.update(request);
  }

  @Put("/")
  public async update(@Body() request: UpsertVolumeRequest): Promise<UpsertVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}.`);
    }

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
      throw new NotFoundException(`Not found volume of ${request.name}.`);
    }
    return await this._wrap(volume);
  }

  @Delete("/:name")
  public async delete(@Param() request: DeleteVolumeRequest): Promise<DeleteVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}.`);
    }

    // delete volume
    process.nextTick(async () => {
      // delete volume
      try {
        await fs.remove(path.join(PATHS.VOLUMES, request.name));
        this.logger.log(`Purge volume ${request.name} successful.`);
      } catch (e) {
        this.logger.error(`Purge volume ${request.name} failed.`, e);
      }
    });

    // delete volume
    await Volume.delete(request.name);
    return { status: "success" };
  }

  @Post("/:name/connect")
  public async connect(@Data() request: ConnectVolumeRequest): Promise<ConnectVolumeResponse> {
    const count = await Volume.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}.`);
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
      throw new NotFoundException(`Not found volume of ${request.name}.`);
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
      createdAt: volume.createdAt.getTime(),
      updatedAt: volume.updatedAt.getTime(),
      binds: volume.binds.map((i) => ({
        name: i.appName,
        path: i.path,
        readonly: i.readonly,
      })),
    };
  }
}
