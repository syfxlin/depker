import { Controller, Get, Query } from "@nestjs/common";
import { AppStatusRequest, AppStatusResponse } from "../views/status.view";
import { DockerService } from "../services/docker.service";

@Controller("/status")
export class StatusController {
  constructor(private readonly docker: DockerService) {}

  @Get("/apps")
  public async apps(@Query() request: AppStatusRequest): Promise<AppStatusResponse> {
    const results: AppStatusResponse = {};

    for (const name of request.names) {
      let status: AppStatusResponse[string] = "stopped";
      try {
        const info = await this.docker.getContainer(name).inspect();
        if (info.State.Status === "running") {
          status = "running";
        } else if (info.State.Status === "restarting") {
          status = "restarting";
        } else if (info.State.Status === "exited") {
          status = "exited";
        }
      } catch (e) {
        status = "stopped";
      }
      results[name] = status;
    }

    return results;
  }
}
