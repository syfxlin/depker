import { ConflictException, Controller, Delete, ForbiddenException, Get, Post } from "@nestjs/common";
import {
  BindsVolumeRequest,
  BindsVolumeResponse,
  CreateVolumeRequest,
  CreateVolumeResponse,
  DeleteVolumeRequest,
  DeleteVolumeResponse,
  ListVolumeResponse,
} from "../views/volume.view";
import fs from "fs-extra";
import { PATHS } from "../constants/depker.constant";
import path from "path";
import { Data } from "../decorators/data.decorator";
import { Service } from "../entities/service.entity";
import { ILike } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { VolumeEvent } from "../events/volume.event";
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/volumes")
export class VolumeController {
  constructor(private readonly events: EventEmitter2) {}

  @Get("/")
  @AuthGuard()
  public async list(): Promise<ListVolumeResponse> {
    return fs.readdirSync(PATHS.VOLUMES);
  }

  @Post("/:volume")
  @AuthGuard()
  public async create(@Data() request: CreateVolumeRequest): Promise<CreateVolumeResponse> {
    const location = path.join(PATHS.VOLUMES, request.volume);
    const relative = path.relative(PATHS.VOLUMES, location);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      fs.ensureDirSync(location);
      await this.events.emitAsync(VolumeEvent.CREATE, request.volume);
      return { status: "success" };
    }
    throw new ForbiddenException(`Illegal volume path of ${request.volume}`);
  }

  @Delete("/:volume")
  @AuthGuard()
  public async delete(@Data() request: DeleteVolumeRequest): Promise<DeleteVolumeResponse> {
    const req = new BindsVolumeRequest();
    req.volume = request.volume;
    const binds = await this.binds(req);
    if (binds.length) {
      throw new ConflictException(`Found binds of volume ${request.volume}, need to remove all binds before delete.`);
    }
    const location = path.join(PATHS.VOLUMES, request.volume);
    const relative = path.relative(PATHS.VOLUMES, location);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      fs.removeSync(location);
      await this.events.emitAsync(VolumeEvent.DELETE, request.volume);
      return { status: "success" };
    }
    throw new ForbiddenException(`Illegal volume path of ${request.volume}`);
  }

  @Get("/:volume/binds")
  @AuthGuard()
  public async binds(@Data() request: BindsVolumeRequest): Promise<BindsVolumeResponse> {
    const services = await Service.findBy({ volumes: ILike(`%${request.volume}%`) });
    return services.filter((a) => a.volumes.find((i) => i.hpath === request.volume)).map((a) => a.name);
  }
}
