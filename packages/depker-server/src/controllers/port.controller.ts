import { Controller, Get, Query } from "@nestjs/common";
import { ListPortRequest, ListPortResponse } from "../views/port.view";
import { Port } from "../entities/port.entity";
import { Like } from "typeorm";

@Controller("/ports")
export class PortController {
  @Get("/")
  public async list(@Query() request: ListPortRequest): Promise<ListPortResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc", all = false } = request;
    const [orderBy, orderAxis] = sort.split(":");
    const [ports, count] = await Port.findAndCount({
      relations: {
        binds: true,
      },
      where: {
        name: search ? Like(`%${search}%`) : undefined,
        port: search ? (Like(`%${search}%`) as any) : undefined,
      },
      order: {
        [orderBy]: orderAxis ? orderAxis : "asc",
      },
      skip: all ? undefined : offset,
      take: all ? undefined : limit,
    });

    const total: ListPortResponse["total"] = count;
    const items: ListPortResponse["items"] = ports.map((i) => ({
      name: i.name,
      proto: i.proto,
      port: i.port,
      binds: i.binds.map((b) => b.appName),
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    return { total, items };
  }
}
