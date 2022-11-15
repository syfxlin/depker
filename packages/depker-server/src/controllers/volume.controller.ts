import { Controller, Get } from "@nestjs/common";
import { ListVolumeResponse } from "../views/volume.view";
import fs from "fs-extra";
import { PATHS } from "../constants/depker.constant";

@Controller("/api/volumes")
export class VolumeController {
  @Get("/")
  public async list(): Promise<ListVolumeResponse> {
    const volumes = fs.readdirSync(PATHS.VOLUMES);
    return volumes.map((p) => `@/${p}`);
  }
}
