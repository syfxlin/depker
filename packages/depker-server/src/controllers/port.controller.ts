import { Controller, Get } from "@nestjs/common";
import { ListPortResponse } from "../views/port.view";
import { Setting } from "../entities/setting.entity";

@Controller("/api/ports")
export class PortController {
  @Get("/")
  public async list(): Promise<ListPortResponse> {
    const setting = await Setting.read();
    const ports = new Set<number>();
    for (const [start, end] of setting.ports) {
      for (let i = start; i <= end; i++) {
        ports.add(i);
      }
    }
    return Array.from(ports.values());
  }
}
