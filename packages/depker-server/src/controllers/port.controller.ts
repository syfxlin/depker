import { ConflictException, Controller, Delete, Get, Post } from "@nestjs/common";
import {
  BindsPortRequest,
  BindsPortResponse,
  CreatePortRequest,
  CreatePortResponse,
  DeletePortRequest,
  DeletePortResponse,
  ListPortResponse,
} from "../views/port.view";
import { Setting } from "../entities/setting.entity";
import { Data } from "../decorators/data.decorator";
import { Service } from "../entities/service.entity";
import { ILike } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PortEvent } from "../events/port.event";
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/ports")
export class PortController {
  constructor(private readonly events: EventEmitter2) {}

  @Get("/")
  @AuthGuard()
  public async list(): Promise<ListPortResponse> {
    const setting = await Setting.read();
    return setting.ports;
  }

  @Post("/:port")
  @AuthGuard()
  public async create(@Data() request: CreatePortRequest): Promise<CreatePortResponse> {
    const setting = await Setting.read();
    const ports = new Set(setting.ports);
    ports.add(request.port);
    setting.ports = Array.from(ports.values());
    await Setting.write(setting);
    await this.events.emitAsync(PortEvent.CREATE, request.port);
    return { status: "success" };
  }

  @Delete("/:port")
  @AuthGuard()
  public async delete(@Data() request: DeletePortRequest): Promise<DeletePortResponse> {
    const req = new BindsPortRequest();
    req.port = request.port;
    const binds = await this.binds(req);
    if (binds.length) {
      throw new ConflictException(`Found binds of port ${request.port}, need to remove all binds before delete.`);
    }
    const setting = await Setting.read();
    const ports = new Set(setting.ports);
    ports.delete(request.port);
    setting.ports = Array.from(ports.values());
    await Setting.write(setting);
    await this.events.emitAsync(PortEvent.DELETE, request.port);
    return { status: "success" };
  }

  @Get("/:port/binds")
  @AuthGuard()
  public async binds(@Data() request: BindsPortRequest): Promise<BindsPortResponse> {
    const services = await Service.findBy({ ports: ILike(`%${request.port}%`) });
    return services.filter((a) => a.ports.find((i) => i.hport === request.port)).map((a) => a.name);
  }
}
