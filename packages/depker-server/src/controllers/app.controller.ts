import {
  BadRequestException,
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
  BuildPacksAppResponse,
  DeleteAppRequest,
  DeleteAppResponse,
  GetAppRequest,
  GetAppResponse,
  ListAppRequest,
  ListAppResponse,
  StatusAppRequest,
  StatusAppResponse,
  UpsertAppRequest,
  UpsertAppResponse,
} from "../views/app.view";
import { DockerService } from "../services/docker.service";
import { App } from "../entities/app.entity";
import { In, Like } from "typeorm";
import { Port } from "../entities/port.entity";
import { Volume } from "../entities/volume.entity";
import { PortBind } from "../entities/port-bind.entity";
import { VolumeBind } from "../entities/volume-bind.entity";
import { PluginService } from "../services/plugin.service";
import { Data } from "../decorators/data.decorator";

@Controller("/apps")
export class AppController {
  constructor(private readonly docker: DockerService, private readonly plugins: PluginService) {}

  @Get("/items")
  public async list(@Query() request: ListAppRequest): Promise<ListAppResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [orderBy, orderAxis] = sort.split(":");
    const [apps, count] = await App.findAndCount({
      select: {
        name: true,
        buildpack: {
          name: true,
        },
        domain: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        name: search ? Like(`%${search}%`) : undefined,
        domain: search ? Like(`%${search}%`) : undefined,
      },
      order: {
        [orderBy]: orderAxis ? orderAxis : "asc",
      },
      skip: offset,
      take: limit,
    });

    const plugins = await this.plugins.plugins();
    const deploys = await App.listDeploydAt(apps.map((i) => i.name));

    const total: ListAppResponse["total"] = count;
    const items: ListAppResponse["items"] = apps.map((i) => {
      const plugin = plugins.get(i.buildpack.name);
      const deploy = deploys.get(i.name);
      return {
        name: i.name,
        buildpack: {
          name: i.buildpack.name,
          label: plugin?.label,
          group: plugin?.group,
          icon: plugin?.icon,
        },
        domain: i.domain,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        deploydAt: deploy ?? new Date(0),
      };
    });

    return { total, items };
  }

  @Post("/items/:name")
  @Put("/items/:name")
  public async upsert(@Data() request: UpsertAppRequest): Promise<UpsertAppResponse> {
    const app = new App();
    app.name = request.name;
    app.buildpack = request.buildpack;
    // web
    app.domain = request.domain!;
    app.rule = request.rule!;
    app.port = request.port!;
    app.scheme = request.scheme!;
    app.tls = request.tls!;
    app.middlewares =
      request.middlewares
        ?.filter((v) => v.name && v.type)
        ?.map((v) => ({ name: v.name, type: v.type, options: v.options ?? {} })) ?? [];
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
    app.labels = request.labels!;
    app.secrets = request.secrets!;
    app.hosts = request.hosts!;
    // ports
    const ports: PortBind[] = [];
    if (request.ports && request.ports.length) {
      const names = request.ports.map((v) => v.name);
      const items = await Port.find({ where: { name: In(names) } });
      if (names.length !== items.length) {
        throw new BadRequestException("Port not created，unable to create app.");
      }
      const maps = items.reduce((m, i) => m.set(i.name, i), new Map<string, Port>());
      for (const port of request.ports) {
        const bind = new PortBind();
        bind.port = port.port;
        bind.bind = maps.get(port.name) as Port;
        ports.push(bind);
      }
    }
    // volumes
    const volumes: VolumeBind[] = [];
    if (request.volumes && request.volumes.length) {
      const names = request.volumes.map((v) => v.name);
      const items = await Volume.find({ where: { name: In(names) } });
      if (names.length !== items.length) {
        throw new BadRequestException("Volume not created，unable to create app.");
      }
      const maps = items.reduce((m, i) => m.set(i.name, i), new Map<string, Volume>());
      for (const volume of request.volumes) {
        const bind = new VolumeBind();
        bind.path = volume.path;
        bind.readonly = volume.readonly;
        bind.bind = maps.get(volume.name) as Volume;
        volumes.push(bind);
      }
    }

    // save app
    await App.save(app, { reload: false });
    const savedApp = await App.findOne({
      where: {
        name: app.name,
      },
      relations: {
        ports: {
          bind: true,
        },
        volumes: {
          bind: true,
        },
      },
    });
    // save ports or volumes
    if (ports.length) {
      await PortBind.upsert(
        ports.map((v) => {
          v.app = savedApp!;
          return v;
        }),
        ["app", "bind", "port"]
      );
    }
    if (volumes.length) {
      await VolumeBind.upsert(
        volumes.map((v) => {
          v.app = savedApp!;
          return v;
        }),
        ["app", "bind", "path"]
      );
    }
    return await this.wrap(savedApp!);
  }

  @Get("/items/:name")
  public async get(@Param() request: GetAppRequest): Promise<GetAppResponse> {
    const app = await App.findOne({
      where: {
        name: request.name,
      },
      relations: {
        ports: {
          bind: true,
        },
        volumes: {
          bind: true,
        },
      },
    });
    if (!app) {
      throw new NotFoundException(`Not found application of ${request.name}`);
    }
    return await this.wrap(app);
  }

  @Delete("/items/:name")
  public async delete(@Param() request: DeleteAppRequest): Promise<DeleteAppResponse> {
    const result = await App.delete(request.name);
    if (!result.affected) {
      throw new NotFoundException(`Not found application of ${request.name}`);
    }
    return { status: "successful" };
  }

  @Get("/status")
  public async status(@Query() request: StatusAppRequest): Promise<StatusAppResponse> {
    const results: StatusAppResponse = {};

    for (const name of request.names) {
      let status: StatusAppResponse[string] = "stopped";
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

  @Get("/buildpacks")
  public async buildpacks(): Promise<BuildPacksAppResponse> {
    const plugins = Array.from((await this.plugins.plugins()).values());
    return plugins
      .filter((p) => p.buildpack)
      .map((p) => ({
        name: p.name,
        label: p.label,
        group: p.group,
        icon: p.icon,
        options: p.options?.buildpack,
      }));
  }

  private async wrap(app: App): Promise<GetAppResponse> {
    const plugin = await this.plugins.plugin(app.buildpack.name);
    return {
      name: app.name,
      buildpack: {
        name: app.buildpack.name,
        values: app.buildpack.values ?? {},
        label: plugin?.label,
        group: plugin?.group,
        icon: plugin?.icon,
        options: plugin?.options?.buildpack,
      },
      commands: app.commands,
      entrypoints: app.entrypoints,
      restart: app.restart,
      pull: app.pull,
      domain: app.domain,
      rule: app.rule,
      port: app.port,
      scheme: app.scheme,
      tls: app.tls,
      middlewares: app.middlewares,
      healthcheck: app.healthcheck,
      init: app.init,
      rm: app.rm,
      privileged: app.privileged,
      user: app.user,
      workdir: app.workdir,
      buildArgs: app.buildArgs,
      networks: app.networks,
      labels: app.labels,
      secrets: app.secrets,
      hosts: app.hosts,
      ports: app.ports.map((i) => ({
        name: i.bind.name,
        proto: i.bind.proto,
        hport: i.bind.port,
        cport: i.port,
      })),
      volumes: app.volumes.map((i) => ({
        name: i.bind.name,
        global: i.bind.global,
        hpath: i.bind.path,
        cpath: i.path,
        readonly: i.readonly,
      })),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }
}
