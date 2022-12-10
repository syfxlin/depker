import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  CancelServiceDeployRequest,
  CancelServiceDeployResponse,
  DeleteServiceRequest,
  DeleteServiceResponse,
  DownServiceRequest,
  DownServiceResponse,
  GetServiceRequest,
  GetServiceResponse,
  HistoryServiceRequest,
  HistoryServiceResponse,
  ListServiceDeployRequest,
  ListServiceDeployResponse,
  ListServiceRequest,
  ListServiceResponse,
  LogsServiceDeployRequest,
  LogsServiceDeployResponse,
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
import { ILike, MoreThanOrEqual } from "typeorm";
import { PluginService } from "../services/plugin.service";
import { StorageService } from "../services/storage.service";
import { Deploy } from "../entities/deploy.entity";
import { Data } from "../decorators/data.decorator";
import { DateTime } from "luxon";
import { DeployLog } from "../entities/deploy-log.entity";
import { Revwalk } from "nodegit";
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";

@Controller("/api/services")
export class ServiceController {
  private readonly logger = new Logger(ServiceController.name);

  constructor(
    private readonly docker: DockerService,
    private readonly storage: StorageService,
    private readonly plugins: PluginService
  ) {}

  @Get("/")
  public async list(@Query() request: ListServiceRequest): Promise<ListServiceResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [by, axis] = sort.split(":");
    const [services, count] = await Service.findAndCount({
      select: {
        name: true,
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

    const plugins = await this.plugins.plugins();
    const deploys = await Service.listDeploydAt(services.map((i) => i.name));
    const status = await this.docker.listStatus(services.map((i) => i.name));

    const total: ListServiceResponse["total"] = count;
    const items: ListServiceResponse["items"] = services.map((i) => {
      const plugin = plugins[i.buildpack];
      const deploy = deploys[i.name];
      return {
        name: i.name,
        buildpack: plugin?.label ?? i.buildpack,
        icon: plugin?.icon ?? "",
        domain: i.domain.length ? i.domain[0] : "",
        status: status[i.name],
        createdAt: i.createdAt.getTime(),
        updatedAt: i.updatedAt.getTime(),
        deploydAt: deploy?.getTime() ?? 0,
      };
    });

    return { total, items };
  }

  @Post("/")
  public async create(@Body() request: UpsertServiceRequest): Promise<UpsertServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found service of ${request.name}.`);
    }
    await Service.insert({ name: request.name, type: request.type, buildpack: request.buildpack });
    return this.update(request);
  }

  @Put("/:name")
  public async update(@Body() request: UpsertServiceRequest): Promise<UpsertServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const service = new Service();
    service.name = request.name;
    service.type = request.type;
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
    const saved = await Service.findOneBy({ name: service.name });
    return saved!.view;
  }

  @Get("/:name")
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
  public async delete(@Param() request: DeleteServiceRequest): Promise<DeleteServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    // purge service
    process.nextTick(async () => {
      // delete container
      try {
        await this.docker.getContainer(request.name).remove({ force: true });
        this.logger.log(`Purge service ${request.name} container successful.`);
      } catch (e) {
        this.logger.error(`Purge service ${request.name} container failed.`, e);
      }
      // delete source
      try {
        await fs.remove(path.join(PATHS.REPOS, `${request.name}.git`));
        this.logger.log(`Purge service ${request.name} source successful.`);
      } catch (e) {
        this.logger.error(`Purge service ${request.name} source failed.`, e);
      }
    });

    // delete service
    await Service.delete(request.name);
    return { status: "success" };
  }

  @Get("/:name/status")
  public async status(@Param() request: StatusServiceRequest): Promise<StatusServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const status = await this.docker.listStatus([request.name]);
    return { status: status[request.name] };
  }

  @Get("/:name/metrics")
  public async metrics(@Param() request: MetricsServiceRequest): Promise<MetricsServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    try {
      const stats = await this.docker.getContainer(request.name).stats({ stream: false });
      const cpu_delta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const system_cpu_delta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const number_cpus = stats.cpu_stats.online_cpus;
      const cpu = (cpu_delta / system_cpu_delta) * number_cpus * 100;
      const memory = stats.memory_stats.usage - stats.memory_stats.stats.cache;
      const input = Object.values(stats.networks).reduce((a, i) => a + i.rx_bytes, 0);
      const output = Object.values(stats.networks).reduce((a, i) => a + i.tx_bytes, 0);
      return {
        cpu: {
          free: 100 - cpu,
          used: cpu,
          total: 100,
        },
        memory: {
          free: stats.memory_stats.limit - memory,
          used: memory,
          total: stats.memory_stats.limit,
        },
        network: {
          input,
          output,
        },
      };
    } catch (e: any) {
      return {
        cpu: {
          free: 0,
          used: 0,
          total: 1,
        },
        memory: {
          free: 0,
          used: 0,
          total: 1,
        },
        network: {
          input: 0,
          output: 0,
        },
      };
    }
  }

  @Get("/:name/history")
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
    } else {
      deploy.target = "unknown";
    }

    const saved = await Deploy.save(deploy);
    return saved!.view;
  }

  @Post("/:name/down")
  public async down(@Data() request: DownServiceRequest): Promise<DownServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    try {
      await this.docker.getContainer(request.name).remove({ force: true });
    } catch (e: any) {
      if (e.statusCode === 404) {
        throw new NotFoundException(`Not found container of ${request.name}`);
      } else {
        throw e;
      }
    }
    return { status: "success" };
  }

  @Post("/:name/restart")
  public async restart(@Data() request: RestartServiceRequest): Promise<RestartServiceResponse> {
    const count = await Service.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    try {
      await this.docker.getContainer(request.name).restart();
    } catch (e: any) {
      if (e.statusCode === 404) {
        throw new NotFoundException(`Not found container of ${request.name}`);
      } else {
        throw e;
      }
    }
    return { status: "success" };
  }

  @Get("/:name/deploy")
  public async listDeploy(@Data() request: ListServiceDeployRequest): Promise<ListServiceDeployResponse> {
    const { name, search = "", offset = 0, limit = 10, sort = "id:desc" } = request;
    const [by, axis] = sort.split(":");
    const exist = await Service.countBy({ name: request.name });
    if (!exist) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const [deploys, count] = await Deploy.findAndCount({
      where: {
        service: { name },
        target: search ? ILike(`%${search}%`) : undefined,
        status: search ? (ILike(`%${search}%`) as any) : undefined,
      },
      relations: { service: true },
      skip: offset,
      take: limit,
      order: { [by]: axis ? axis : "asc" },
    });

    const total: ListServiceDeployResponse["total"] = count;
    const items: ListServiceDeployResponse["items"] = deploys.map((d) => d.view);

    return { total, items };
  }

  @Get("/:name/deploy/:id/logs")
  public async logsDeploy(@Data() request: LogsServiceDeployRequest): Promise<LogsServiceDeployResponse> {
    const { id, name, since, tail } = request;
    const count = await Deploy.countBy({ id, service: { name } });
    if (!count) {
      throw new NotFoundException(`Not found deploy of ${name}.`);
    }

    const lines = await DeployLog.find({
      where: {
        deploy: { id },
        time: typeof since === "number" ? MoreThanOrEqual(DateTime.fromMillis(since).toJSDate()) : undefined,
      },
      take: typeof tail === "number" ? tail : undefined,
      order: { id: "desc" },
    });
    const deploy = await Deploy.findOne({ where: { id, service: { name } } });

    lines.reverse();

    const logs: LogsServiceDeployResponse["logs"] = lines.map((i) => [i.level, i.time.getTime(), i.line]);
    if (["success", "failed"].includes(deploy!.status)) {
      return { since: -1, logs };
    }
    if (lines.length) {
      return { since: lines[lines.length - 1].time.getTime() + 1, logs };
    }
    if (since) {
      return { since, logs };
    }
    return { since: 0, logs };
  }

  @Delete("/:name/deploy/:id/cancel")
  public async cancelDeploy(@Data() request: CancelServiceDeployRequest): Promise<CancelServiceDeployResponse> {
    const { id, name } = request;
    const count = await Deploy.countBy({ id, service: { name } });
    if (!count) {
      throw new NotFoundException(`Not found deploy of ${name}.`);
    }
    await Deploy.update(id, { status: "failed" });
    return { status: "success" };
  }
}
