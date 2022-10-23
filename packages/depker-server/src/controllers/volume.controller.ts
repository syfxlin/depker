import { Controller, Get, Query } from "@nestjs/common";
import { Like } from "typeorm";
import { ListVolumeRequest, ListVolumeResponse } from "../views/volume.view";
import { Volume } from "../entities/volume.entity";

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
}
