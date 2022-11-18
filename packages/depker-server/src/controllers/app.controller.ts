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
  CancelAppDeployRequest,
  CancelAppDeployResponse,
  DeleteAppRequest,
  DeleteAppResponse,
  DownAppRequest,
  DownAppResponse,
  GetAppRequest,
  GetAppResponse,
  HistoryAppRequest,
  HistoryAppResponse,
  ListAppDeployRequest,
  ListAppDeployResponse,
  ListAppRequest,
  ListAppResponse,
  LogsAppDeployRequest,
  LogsAppDeployResponse,
  MetricsAppRequest,
  MetricsAppResponse,
  RestartAppRequest,
  RestartAppResponse,
  StatusAppRequest,
  StatusAppResponse,
  UpAppRequest,
  UpAppResponse,
  UpsertAppRequest,
  UpsertAppResponse,
} from "../views/app.view";
import { DockerService } from "../services/docker.service";
import { App } from "../entities/app.entity";
import { ILike, MoreThanOrEqual } from "typeorm";
import { PluginService } from "../services/plugin.service";
import { StorageService } from "../services/storage.service";
import { Deploy } from "../entities/deploy.entity";
import { Data } from "../decorators/data.decorator";
import { DateTime } from "luxon";
import { Log } from "../entities/log.entity";
import { Revwalk } from "nodegit";
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";

@Controller("/api/apps")
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly docker: DockerService,
    private readonly storage: StorageService,
    private readonly plugins: PluginService
  ) {}

  @Get("/")
  public async list(@Query() request: ListAppRequest): Promise<ListAppResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [by, axis] = sort.split(":");
    const [apps, count] = await App.findAndCount({
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
    const deploys = await App.listDeploydAt(apps.map((i) => i.name));
    const status = await this.docker.listStatus(apps.map((i) => i.name));

    const total: ListAppResponse["total"] = count;
    const items: ListAppResponse["items"] = apps.map((i) => {
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
  public async create(@Body() request: UpsertAppRequest): Promise<UpsertAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found application of ${request.name}.`);
    }
    await App.insert({ name: request.name, buildpack: request.buildpack });
    return this.update(request);
  }

  @Put("/:name")
  public async update(@Body() request: UpsertAppRequest): Promise<UpsertAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }

    const app = new App();
    app.name = request.name;
    app.buildpack = request.buildpack;
    // web
    app.domain = request.domain!;
    app.rule = request.rule!;
    app.port = request.port!;
    app.scheme = request.scheme!;
    app.tls = request.tls!;
    app.middlewares = request.middlewares!.map((i) => ({ name: i.name, type: i.type, options: i.options }));
    // extensions
    app.commands = request.commands!;
    app.entrypoints = request.entrypoints!;
    app.restart = request.restart!;
    app.pull = request.pull!;
    app.healthcheck = request.healthcheck!;
    app.init = request.init!;
    app.rm = request.rm!;
    app.privileged = request.privileged!;
    app.user = request.user!;
    app.workdir = request.workdir!;
    // values
    app.buildArgs = request.buildArgs!;
    app.networks = request.networks!;
    app.labels = request.labels!.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    app.secrets = request.secrets!.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    app.hosts = request.hosts!.map((i) => ({ name: i.name, value: i.value, onbuild: i.onbuild }));
    app.ports = request.ports!.map((i) => ({ hport: i.hport, cport: i.cport, proto: i.proto }));
    app.volumes = request.volumes!.map((i) => ({ hpath: i.hpath, cpath: i.cpath, readonly: i.readonly }));
    app.extensions = request.extensions!;

    // save app
    await App.save(app, { reload: false });
    const saved = await App.findOneBy({ name: app.name });
    return saved!.toView();
  }

  @Get("/:name")
  public async get(@Param() request: GetAppRequest): Promise<GetAppResponse> {
    const app = await App.findOne({
      where: {
        name: request.name,
      },
    });
    if (!app) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }
    return app.toView();
  }

  @Delete("/:name")
  public async delete(@Param() request: DeleteAppRequest): Promise<DeleteAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }

    // purge application
    process.nextTick(async () => {
      // delete container
      try {
        await this.docker.getContainer(request.name).remove({ force: true });
        this.logger.log(`Purge application ${request.name} container successful.`);
      } catch (e) {
        this.logger.error(`Purge application ${request.name} container failed.`, e);
      }
      // delete source
      try {
        await fs.remove(path.join(PATHS.REPOS, `${request.name}.git`));
        this.logger.log(`Purge application ${request.name} source successful.`);
      } catch (e) {
        this.logger.error(`Purge application ${request.name} source failed.`, e);
      }
    });

    // delete application
    await App.delete(request.name);
    return { status: "success" };
  }

  @Get("/:name/status")
  public async status(@Param() request: StatusAppRequest): Promise<StatusAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }

    const status = await this.docker.listStatus([request.name]);
    return { status: status[request.name] };
  }

  @Get("/:name/metrics")
  public async metrics(@Param() request: MetricsAppRequest): Promise<MetricsAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
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
  public async history(@Data() request: HistoryAppRequest): Promise<HistoryAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
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

    const total: HistoryAppResponse["total"] = commits.length;
    const items: HistoryAppResponse["items"] = commits
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
  public async up(@Data() request: UpAppRequest): Promise<UpAppResponse> {
    const app = await App.findOne({ where: { name: request.name } });
    if (!app) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }

    const deploy = new Deploy();
    deploy.app = app;
    deploy.status = "queued";
    deploy.trigger = request.trigger ?? "manual";

    const repo = await this.storage.repository(request.name);
    if (repo) {
      try {
        const commit = await repo.getMasterCommit();
        deploy.commit = commit.id().tostrS();
      } catch (e) {
        throw new NotFoundException(`Found application source but not found commit of ${request.name}`);
      }
    } else {
      deploy.commit = "unknown";
    }

    const saved = await Deploy.save(deploy);
    return saved!.toView();
  }

  @Post("/:name/down")
  public async down(@Data() request: DownAppRequest): Promise<DownAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
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
  public async restart(@Data() request: RestartAppRequest): Promise<RestartAppResponse> {
    const count = await App.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
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
  public async listDeploy(@Data() request: ListAppDeployRequest): Promise<ListAppDeployResponse> {
    const { name, search = "", offset = 0, limit = 10, sort = "id:desc" } = request;
    const [by, axis] = sort.split(":");
    const exist = await App.countBy({ name: request.name });
    if (!exist) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }

    const [deploys, count] = await Deploy.findAndCount({
      where: {
        app: { name },
        commit: search ? ILike(`%${search}%`) : undefined,
        status: search ? (ILike(`%${search}%`) as any) : undefined,
        trigger: search ? (ILike(`%${search}%`) as any) : undefined,
      },
      relations: { app: true },
      skip: offset,
      take: limit,
      order: { [by]: axis ? axis : "asc" },
    });

    const total: ListAppDeployResponse["total"] = count;
    const items: ListAppDeployResponse["items"] = deploys.map((d) => d.toView());

    return { total, items };
  }

  @Get("/:name/deploy/:id/logs")
  public async logsDeploy(@Data() request: LogsAppDeployRequest): Promise<LogsAppDeployResponse> {
    const { id, name, since, tail } = request;
    const count = await Deploy.countBy({ id, app: { name } });
    if (!count) {
      throw new NotFoundException(`Not found deploy of ${name}.`);
    }

    const lines = await Log.find({
      where: {
        deploy: { id },
        time: typeof since === "number" ? MoreThanOrEqual(DateTime.fromMillis(since).toJSDate()) : undefined,
      },
      take: typeof tail === "number" ? tail : undefined,
      order: { id: "desc" },
    });
    const deploy = await Deploy.findOne({ where: { id, app: { name } } });

    lines.reverse();

    const logs: LogsAppDeployResponse["logs"] = lines.map((i) => [i.level, i.time.getTime(), i.line]);
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
  public async cancelDeploy(@Data() request: CancelAppDeployRequest): Promise<CancelAppDeployResponse> {
    const { id, name } = request;
    const count = await Deploy.countBy({ id, app: { name } });
    if (!count) {
      throw new NotFoundException(`Not found deploy of ${name}.`);
    }
    await Deploy.update(id, { status: "failed" });
    return { status: "success" };
  }
}
