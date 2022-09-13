import { Controller, Get } from "@nestjs/common";
import pjson from "../../package.json" assert { type: "json" };

@Controller("/api/v1")
export class VersionController {
  @Get("/version")
  public version() {
    return {
      name: pjson.name,
      description: pjson.description,
      version: pjson.version,
    };
  }

  @Get("/healthcheck")
  public healthcheck() {
    return "OK";
  }
}
