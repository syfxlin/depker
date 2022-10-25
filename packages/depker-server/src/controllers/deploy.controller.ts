import { Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { CreateDeployRequest } from "../views/deploy.view";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "../services/storage.service";
import { App } from "../entities/app.entity";

@Controller("/deploy")
export class DeployController {
  constructor(private readonly storage: StorageService) {}

  @Post("/")
  public async create(@Body() request: CreateDeployRequest) {
    const app = await App.findOne({ where: { name: request.app } });
    if (!app) {
      throw new NotFoundException(`Not found application of ${request.app}.`);
    }
    const git = await this.storage.git(request.app);
    if (!git) {
      throw new NotFoundException(`Not found application source of ${request.app}.`);
    }
    const deploy = new Deploy();
    deploy.app = app;
    deploy.status = "queued";
    deploy.force = request.force ?? false;
    deploy.trigger = request.trigger ?? "manual";

    git.show();
  }
}
