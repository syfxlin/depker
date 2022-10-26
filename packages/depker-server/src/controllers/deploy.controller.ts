import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import {
  CancelDeployRequest,
  CancelDeployResponse,
  DispatchDeployRequest,
  DispatchDeployResponse,
  GetDeployRequest,
  GetDeployResponse,
  ListDeployRequest,
  ListDeployResponse,
} from "../views/deploy.view";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "../services/storage.service";
import { App } from "../entities/app.entity";
import { FindManyOptions, FindOptionsWhere, Like } from "typeorm";

@Controller("/deploy")
export class DeployController {
  constructor(private readonly storage: StorageService) {}

  @Get("/")
  public async list(@Query() request: ListDeployRequest): Promise<ListDeployResponse> {
    const where: FindOptionsWhere<Deploy> = {};
    if (request.app) {
      where.app = { name: request.app };
    }
    if (request.commit) {
      where.commit = request.commit;
    }
    if (request.status) {
      where.status = request.status;
    }
    if (request.trigger) {
      where.trigger = request.trigger;
    }
    if (request.force === true || request.force === false) {
      where.force = request.force;
    }
    if (request.search) {
      if (!where.commit) {
        where.commit = Like(`%${request.search}%`);
      }
      if (!where.status) {
        where.status = Like(`%${request.search}%`) as any;
      }
      if (!where.trigger) {
        where.trigger = Like(`%${request.search}%`) as any;
      }
    }

    const options: FindManyOptions<Deploy> = {
      where: where,
      relations: { app: true },
      skip: 0,
      take: 10,
      order: { id: "desc" },
    };
    if (request.offset) {
      options.skip = request.offset;
    }
    if (request.limit) {
      options.take = request.limit;
    }
    if (request.sort) {
      const [by, axis] = request.sort.split(":");
      options.order = { [by]: axis };
    }

    const [deploys, count] = await Deploy.findAndCount(options);

    const total: ListDeployResponse["total"] = count;
    const items: ListDeployResponse["items"] = await Promise.all(deploys.map((i) => this._wrap(i)));

    return { total, items };
  }

  @Post("/")
  @Put("/")
  public async dispatch(@Body() request: DispatchDeployRequest): Promise<DispatchDeployResponse> {
    const app = await App.findOne({ where: { name: request.app } });
    if (!app) {
      throw new NotFoundException(`Not found application of ${request.app}.`);
    }
    const repo = await this.storage.repository(request.app);
    if (!repo) {
      throw new NotFoundException(`Not found application source of ${request.app}.`);
    }

    const deploy = new Deploy();
    deploy.app = app;
    deploy.status = "queued";
    deploy.force = request.force ?? false;
    deploy.trigger = request.trigger ?? "manual";

    try {
      const commit = await repo.getReferenceCommit(request.ref);
      deploy.commit = commit.id().tostrS();
    } catch (e) {
      // ignore
    }
    try {
      const commit = await repo.getCommit(request.ref);
      deploy.commit = commit.id().tostrS();
    } catch (e) {
      // ignore
    }

    if (!deploy.commit) {
      throw new NotFoundException(`Not found reference of ${request.app}`);
    }

    const savedDeploy = await Deploy.save(deploy);
    return await this._wrap(savedDeploy);
  }

  @Get("/:id")
  public async get(@Param() request: GetDeployRequest): Promise<GetDeployResponse> {
    const deploy = await Deploy.findOne({
      where: {
        id: request.id,
      },
      relations: {
        app: true,
      },
    });
    if (!deploy) {
      throw new NotFoundException(`Not found deploy of ${request.id}.`);
    }
    return await this._wrap(deploy);
  }

  @Delete("/:id")
  public async cancel(@Param() request: CancelDeployRequest): Promise<CancelDeployResponse> {
    const deploy = await Deploy.findOne({ where: { id: request.id } });
    if (!deploy) {
      throw new NotFoundException(`Not found deploy of ${request.id}.`);
    }
    deploy.status = "failed";
    await Deploy.save(deploy);
    return { status: "success" };
  }

  public async _wrap(deploy: Deploy): Promise<GetDeployResponse> {
    return {
      id: deploy.id,
      app: deploy.app.name,
      commit: deploy.commit,
      status: deploy.status,
      trigger: deploy.trigger,
      force: deploy.force,
      createdAt: deploy.createdAt,
      updatedAt: deploy.updatedAt,
    };
  }
}
