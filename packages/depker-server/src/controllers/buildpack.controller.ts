import { Controller, Get } from "@nestjs/common";
import { PluginService } from "../services/plugin.service";
import { ListBuildPackResponse } from "../views/buildpack.view";
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/buildpacks")
export class BuildpackController {
  constructor(private readonly plugins: PluginService) {}

  @Get("/")
  @AuthGuard()
  public async list(): Promise<ListBuildPackResponse> {
    return Object.values(await this.plugins.buildpacks()).map((p) => ({
      name: p.name,
      label: p.label,
      group: p.group,
      icon: p.icon,
      options: p.buildpack?.options,
    }));
  }
}
