import { Controller, Get, Put } from "@nestjs/common";
import { GetSettingResponse, UpdateSettingRequest, UpdateSettingResponse } from "../views/setting.view";
import { Setting } from "../entities/setting.entity";
import { Data } from "../decorators/data.decorator";

@Controller("/api/settings")
export class SettingController {
  @Get("/")
  public async get(): Promise<GetSettingResponse> {
    const setting = await Setting.read();
    return setting.view;
  }

  @Put("/")
  public async update(@Data() request: UpdateSettingRequest): Promise<UpdateSettingResponse> {
    await Setting.write(request);
    const setting = await Setting.read();
    return setting.view;
  }
}
