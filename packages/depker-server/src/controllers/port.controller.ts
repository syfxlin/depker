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
import { App } from "../entities/app.entity";
import { ILike } from "typeorm";

@Controller("/api/ports")
export class PortController {
  @Get("/")
  public async list(): Promise<ListPortResponse> {
    const setting = await Setting.read();
    return setting.ports;
  }

  @Post("/")
  public async create(@Data() request: CreatePortRequest): Promise<CreatePortResponse> {
    const setting = await Setting.read();
    const ports = new Set(setting.ports);
    ports.add(request.port);
    setting.ports = Array.from(ports.values());
    await Setting.write(setting);
    return { status: "success" };
  }

  @Delete("/")
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
    return { status: "success" };
  }

  @Get("/:port/binds")
  public async binds(@Data() request: BindsPortRequest): Promise<BindsPortResponse> {
    const apps = await App.findBy({ ports: ILike(`%${request.port}%`) });
    return apps.filter((a) => a.ports.find((i) => i.hport === request.port)).map((a) => a.name);
  }
}
