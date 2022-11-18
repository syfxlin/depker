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
import { App } from "../entities/app.entity";
import { ILike } from "typeorm";

@Controller("/api/volumes")
export class VolumeController {
  @Get("/")
  public async list(): Promise<ListVolumeResponse> {
    const volumes = fs.readdirSync(PATHS.VOLUMES);
    return volumes.map((p) => `@/${p}`);
  }

  @Post("/")
  public async create(@Data() request: CreateVolumeRequest): Promise<CreateVolumeResponse> {
    const location = path.join(PATHS.VOLUMES, request.volume.replace(/^@\//, ""));
    const relative = path.relative(PATHS.VOLUMES, location);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      fs.ensureDirSync(location);
      return { status: "success" };
    }
    throw new ForbiddenException(`Illegal volume path of ${request.volume}`);
  }

  @Delete("/")
  public async delete(@Data() request: DeleteVolumeRequest): Promise<DeleteVolumeResponse> {
    const req = new BindsVolumeRequest();
    req.volume = request.volume;
    const binds = await this.binds(req);
    if (binds.length) {
      throw new ConflictException(`Found binds of volume ${request.volume}, need to remove all binds before delete.`);
    }
    const location = path.join(PATHS.VOLUMES, request.volume.replace(/^@\//, ""));
    const relative = path.relative(PATHS.VOLUMES, location);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      fs.removeSync(location);
      return { status: "success" };
    }
    throw new ForbiddenException(`Illegal volume path of ${request.volume}`);
  }

  @Get("/:volume/binds")
  public async binds(@Data() request: BindsVolumeRequest): Promise<BindsVolumeResponse> {
    const apps = await App.findBy({ volumes: ILike(`%${request.volume}%`) });
    return apps.filter((a) => a.volumes.find((i) => i.hpath === request.volume)).map((a) => a.name);
  }
}
