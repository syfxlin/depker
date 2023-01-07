import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  DeleteServiceRequest,
  DeleteServiceResponse,
  DownServiceRequest,
  DownServiceResponse,
  GetServiceRequest,
  GetServiceResponse,
  HistoryServiceRequest,
  HistoryServiceResponse,
  ListServiceRequest,
  ListServiceResponse,
  MetricsServiceRequest,
  MetricsServiceResponse,
  RestartServiceRequest,
  RestartServiceResponse,
  StatusServiceRequest,
  StatusServiceResponse,
  UpsertServiceRequest,
  UpsertServiceResponse,
  UpServiceRequest,
  UpServiceResponse,
} from "../views/service.view";
import { DockerService } from "../services/docker.service";
import { Service } from "../entities/service.entity";
import { ILike } from "typeorm";
import { PluginService } from "../services/plugin.service";
import { StorageService } from "../services/storage.service";
import { Deploy } from "../entities/deploy.entity";
import { Data } from "../decorators/data.decorator";
import { Revwalk } from "nodegit";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ServiceEvent } from "../events/service.event";
import { Cron } from "../entities/cron.entity";
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/services")
export class ServiceController {
  constructor(
    private readonly docker: DockerService,
    private readonly storage: StorageService,
    private readonly plugins: PluginService,
    private readonly events: EventEmitter2
  ) {}

  @Get("/")
  @AuthGuard()
  public async list(@Query() request: ListServiceRequest): Promise<ListServiceResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [by, axis] = sort.split(":");
    const [services, count] = await Service.findAndCount({
      select: {
        name: true,
        type: true,
        buildpack: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        name: search ? ILike(`%${search}%`) : undefined,
        domain: search ? ILike(`%${search}%`) : undefined,
      },
      order: {
        [by]: axis ? axis : "asc",
      },
      skip: offset,
      take: limit,
    });

    const [plugins, deploys, containers] = await Promise.all([
      this.plugins.plugins(),
      Service.listDeploydAt(services.map((i) => i.name)),
      this.docker.containers.status(services.map((i) => ({ name: i.name, type: i.type }))),
    ]);

    const total: ListServiceResponse["total"] = count;
    const items: ListServiceResponse["items"] = services.map((i) => {
      const plugin = plugins[i.buildpack];
      const deploy = deploys[i.name];
      const status = containers[i.name];
      return {
        name: i.name,
        type: i.type,
        buildpack: plugin?.label ?? i.buildpack,
        icon: plugin?.icon ?? "",
        domain: i.domain.length ? i.domain[0] : "",
        status: status ?? "stopped",
        createdAt: i.createdAt.getTime(),
        updatedAt: i.updatedAt.getTime(),
        deploydAt: deploy?.getTime() ?? 0,
      };
    });

    return { total, items };
  }

  @Post("/")
  @AuthGuard()
  public async create(@Body() request: UpsertServiceRequest): Promise<UpsertServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found service of ${request.name}.`);
    }
    // insert
    await Service.insert({ name: request.name, type: request.type, buildpack: request.buildpack });

    // emit event
    await this.events.emitAsync(ServiceEvent.CREATE, request.name);

    // update
    return this.update(request);
  }

  @Put("/:name")
  @AuthGuard()
  public async update(@Body() request: UpsertServiceRequest): Promise<UpsertServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const plugins = await this.plugins.plugins();
    const plugin = plugins[request.buildpack];
    if (!plugin || !plugin.buildpack?.handler) {
      throw new NotFoundException(`Not found buildpack of ${request.buildpack}`);
    }
    await this.plugins.validate(plugin.buildpack?.options ?? [], request.extensions ?? {});

    const service = new Service();
    service.name = request.name;
    service.buildpack = request.buildpack;
    // web
    service.domain = request.domain!;
    service.rule = request.rule!;
    service.port = request.port!;
    service.scheme = request.scheme!;
    service.tls = request.tls!;
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.middlewares = request.middlewares!?.map((i) => ({ name: i.name, type: i.type, options: i.options }));
    // extensions
    service.commands = request.commands!;
    service.entrypoints = request.entrypoints!;
    service.restart = request.restart!;
    service.pull = request.pull!;
    service.healthcheck = request.healthcheck!;
    service.init = request.init!;
    service.rm = request.rm!;
    service.privileged = request.privileged!;
    service.user = request.user!;
    service.workdir = request.workdir!;
    // values
    service.buildArgs = request.buildArgs!;
    service.networks = request.networks!;
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.labels = request.labels!?.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.secrets = request.secrets!?.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.hosts = request.hosts!?.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.ports = request.ports!?.map((i) => ({ hport: i.hport, cport: i.cport, proto: i.proto }));
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    service.volumes = request.volumes!?.map((i) => ({ hpath: i.hpath, cpath: i.cpath, readonly: i.readonly }));
    service.extensions = request.extensions!;

    // save service
    await Service.save(service, { reload: false });

    // result
    const saved = await Service.findOneBy({ name: service.name });

    // emit event
    await this.events.emitAsync(ServiceEvent.UPDATE, service.name);

    return saved!.view;
  }

  @Get("/:name")
  @AuthGuard()
  public async get(@Param() request: GetServiceRequest): Promise<GetServiceResponse> {
    const service = await Service.findOne({
      where: {
        name: request.name,
      },
    });
    if (!service) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }
    return service.view;
  }

  @Delete("/:name")
  @AuthGuard()
  public async delete(@Param() request: DeleteServiceRequest): Promise<DeleteServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    // delete service
    await Service.delete(request.name);

    // purge service
    await this.events.emitAsync(ServiceEvent.DELETE, request.name);

    // result
    return { status: "success" };
  }

  @Get("/:name/status")
  @AuthGuard()
  public async status(@Param() request: StatusServiceRequest): Promise<StatusServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const status = await this.docker.containers.status({ name: one.name, type: one.type });
    return { status };
  }

  @Get("/:name/history")
  @AuthGuard()
  public async history(@Data() request: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }
    const repo = await this.storage.repository(request.name);
    if (!repo) {
      return { total: 0, items: [] };
    }

    const { offset = 0, limit = 10 } = request;
    const master = await repo.getMasterCommit();
    const walk = repo.createRevWalk();
    walk.push(master.id());
    walk.sorting(Revwalk.SORT.TOPOLOGICAL, Revwalk.SORT.TIME);

    const references = await repo.getReferences();
    const refs = new Map<string, Array<string>>();
    for (const reference of references) {
      const id = reference.target().tostrS();
      const name = reference.name();
      const arr = refs.get(id) ?? [];
      if (reference.isBranch()) {
        arr.push(name.replace("refs/heads/", ""));
      }
      if (reference.isTag()) {
        arr.push(name.replace("refs/tags/", "tag: "));
      }
      refs.set(id, arr);
    }

    const all = offset + limit + 1;
    const commits = await walk.getCommits(all);

    const total: HistoryServiceResponse["total"] = commits.length;
    const items: HistoryServiceResponse["items"] = commits
      .slice(offset, commits.length !== all ? commits.length : commits.length - 1)
      .map((i) => {
        const commit = i.id().tostrS();
        const message = i.message();
        const body = i.body();
        const author = i.author().name();
        const email = i.author().email();
        const time = i.timeMs();
        return { commit, message, body, author, email, time, refs: refs.get(commit) ?? [] };
      });

    return { total, items };
  }

  @Post("/:name/up")
  @AuthGuard()
  public async up(@Data() request: UpServiceRequest): Promise<UpServiceResponse> {
    const service = await Service.findOne({ where: { name: request.name } });
    if (!service) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const deploy = new Deploy();
    deploy.service = service;
    deploy.status = "queued";

    const repo = await this.storage.repository(request.name);
    if (repo) {
      try {
        const commit = await repo.getMasterCommit();
        deploy.target = commit.id().tostrS();
      } catch (e) {
        throw new NotFoundException(`Found service source but not found commit of ${request.name}`);
      }
    } else if (service.buildpack === "image") {
      deploy.target = service.extensions.image;
    }
    if (!deploy.target) {
      deploy.target = "unknown";
    }

    // save
    const saved = await Deploy.save(deploy);

    // emit event
    await this.events.emitAsync(ServiceEvent.UP, request.name);

    return saved!.view;
  }

  @Post("/:name/down")
  @AuthGuard()
  public async down(@Data() request: DownServiceRequest): Promise<DownServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    // emit event
    await this.events.emitAsync(ServiceEvent.DOWN, request.name);

    return { status: "success" };
  }

  // region type=app

  @Post("/:name/restart")
  @AuthGuard()
  public async restart(@Data() request: RestartServiceRequest): Promise<RestartServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }
    if (one.type !== "app") {
      throw new ConflictException(`${request.name} service type is app, which does not support the restart operation.`);
    }

    // restart
    try {
      await this.docker.containers.restart(request.name);
    } catch (e: any) {
      if (e.statusCode === 404) {
        throw new NotFoundException(`Not found container of ${request.name}`);
      } else {
        throw e;
      }
    }

    // emit event
    await this.events.emitAsync(ServiceEvent.RESTART, request.name);

    return { status: "success" };
  }

  @Get("/:name/metrics")
  @AuthGuard()
  public async metrics(@Param() request: MetricsServiceRequest): Promise<MetricsServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }
    if (one.type !== "app") {
      throw new ConflictException(`${request.name} service type is app, which does not support the restart operation.`);
    }

    return this.docker.containers.stats(request.name);
  }

  // endregion

  // region type=job

  @Post("/:name/trigger")
  @AuthGuard()
  public async trigger(@Data() request: RestartServiceRequest): Promise<RestartServiceResponse> {
    const one = await Service.findOneBy({ name: request.name });
    if (!one) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }
    if (one.type !== "job") {
      throw new ConflictException(`${request.name} service type is job, which does not support the trigger operation.`);
    }

    const info = await this.docker.containers.find(request.name);
    if (!info || !info.Labels["depker.cron"]) {
      throw new NotFoundException(`Not found cron job of ${request.name}.`);
    }

    // trigger
    const history = new Cron();
    history.service = one;
    history.status = "queued";
    await Cron.save(history);

    // emit event
    await this.events.emitAsync(ServiceEvent.TRIGGER, request.name);

    return { status: "success" };
  }

  // endregion
}
