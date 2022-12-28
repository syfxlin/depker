import { Controller, Get, Put } from "@nestjs/common";
import { GetSettingResponse, UpdateSettingRequest, UpdateSettingResponse } from "../views/setting.view";
import { Setting } from "../entities/setting.entity";
import { Data } from "../decorators/data.decorator";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SettingEvent } from "../events/setting.event";

@Controller("/api/settings")
export class SettingController {
  constructor(private readonly events: EventEmitter2) {}

  @Get("/")
  public async get(): Promise<GetSettingResponse> {
    const setting = await Setting.read();
    return setting.view;
  }

  @Put("/")
  public async update(@Data() request: UpdateSettingRequest): Promise<UpdateSettingResponse> {
    await Setting.write(request);
    const setting = await Setting.read();
    await this.events.emitAsync(SettingEvent.UPDATE, setting);
    return setting.view;
  }
}
