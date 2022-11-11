import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ConnectPortRequest,
  ConnectPortResponse,
  DeletePortRequest,
  DeletePortResponse,
  DisconnectPortRequest,
  DisconnectPortResponse,
  GetPortRequest,
  GetPortResponse,
  ListPortRequest,
  ListPortResponse,
  UpsertPortRequest,
  UpsertPortResponse,
} from "../views/port.view";
import { Port } from "../entities/port.entity";
import { Like } from "typeorm";
import { Data } from "../decorators/data.decorator";
import { PortBind } from "../entities/port-bind.entity";

@Controller("/api/ports")
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
      createdAt: i.createdAt.getTime(),
      updatedAt: i.updatedAt.getTime(),
    }));

    return { total, items };
  }

  @Post("/")
  public async create(@Body() request: UpsertPortRequest): Promise<UpsertPortResponse> {
    const count = await Port.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found port of ${request.name}.`);
    }
    await Port.insert({
      name: request.name,
      proto: request.proto,
      port: request.port,
    });
    return this.update(request);
  }

  @Put("/:name")
  public async update(@Body() request: UpsertPortRequest): Promise<UpsertPortResponse> {
    const count = await Port.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found port of ${request.name}.`);
    }

    const port = new Port();
    port.name = request.name;
    port.proto = request.proto;
    port.port = request.port;

    await Port.save(port, { reload: false });
    const savedPort = await Port.findOne({
      where: {
        name: port.name,
      },
      relations: {
        binds: true,
      },
    });

    return await this._wrap(savedPort!);
  }

  @Get("/:name")
  public async get(@Param() request: GetPortRequest): Promise<GetPortResponse> {
    const port = await Port.findOne({
      where: {
        name: request.name,
      },
      relations: {
        binds: true,
      },
    });
    if (!port) {
      throw new NotFoundException(`Not found port of ${request.name}.`);
    }
    return await this._wrap(port);
  }

  @Delete("/:name")
  public async delete(@Param() request: DeletePortRequest): Promise<DeletePortResponse> {
    const result = await Port.delete(request.name);
    if (!result.affected) {
      throw new NotFoundException(`Not found port of ${request.name}.`);
    }
    return { status: "success" };
  }

  @Post("/:name/connect")
  public async connect(@Data() request: ConnectPortRequest): Promise<ConnectPortResponse> {
    const count = await Port.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found port of ${request.name}.`);
    }
    const bind = new PortBind();
    bind.bindName = request.name;
    bind.appName = request.app;
    bind.port = request.port;
    await PortBind.save(bind);
    return { status: "success" };
  }

  @Delete("/:name/disconnect")
  public async disconnect(@Data() request: DisconnectPortRequest): Promise<DisconnectPortResponse> {
    const count = await Port.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found port of ${request.name}.`);
    }
    await PortBind.delete({
      bindName: request.name,
      appName: request.app,
    });
    return { status: "success" };
  }

  private async _wrap(port: Port): Promise<GetPortResponse> {
    return {
      name: port.name,
      proto: port.proto,
      port: port.port,
      createdAt: port.createdAt.getTime(),
      updatedAt: port.updatedAt.getTime(),
      binds: port.binds.map((i) => ({
        name: i.appName,
        port: i.port,
      })),
    };
  }
}
