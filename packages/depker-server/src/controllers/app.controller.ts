import {
  BadRequestException,
  Body,
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
import { diff } from "../utils/save.util";

@Controller("/apps")
export class AppController {
  constructor(private readonly docker: DockerService, private readonly plugins: PluginService) {}

  @Get("/")
  public async list(@Query() request: ListAppRequest): Promise<ListAppResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [orderBy, orderAxis] = sort.split(":");
    const [apps, count] = await App.findAndCount({
      select: {
        name: true,
        buildpack: true,
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
    const status = await this._status(apps.map((i) => i.name));

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
  @Put("/")
  public async upsert(@Body() request: UpsertAppRequest): Promise<UpsertAppResponse> {
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
    app.extensions = request.extensions!;
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
    if (ports.length && savedApp) {
      const value = diff([ports, savedApp.ports], (v) => v.bind.name);
      await PortBind.save(
        value.upsert.map((v) => {
          v.app = savedApp;
          return v;
        })
      );
      await PortBind.remove(
        value.remove.map((v) => {
          v.app = savedApp;
          return v;
        })
      );
      savedApp.ports = ports;
    }
    if (volumes.length && savedApp) {
      const value = diff([volumes, savedApp.volumes], (v) => v.bind.name);
      await VolumeBind.save(
        value.upsert.map((v) => {
          v.app = savedApp!;
          return v;
        })
      );
      await VolumeBind.remove(
        value.remove.map((v) => {
          v.app = savedApp!;
          return v;
        })
      );
      savedApp.volumes = volumes;
    }
    return await this._wrap(savedApp!);
  }

  @Get("/:name")
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
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }
    return await this._wrap(app);
  }

  @Delete("/:name")
  public async delete(@Param() request: DeleteAppRequest): Promise<DeleteAppResponse> {
    const result = await App.delete(request.name);
    if (!result.affected) {
      throw new NotFoundException(`Not found application of ${request.name}.`);
    }
    return { status: "success" };
  }

  @Get("/:name/status")
  public async status(@Param() request: StatusAppRequest): Promise<StatusAppResponse> {
    const name = request.name;
    const status = await this._status([name]);
    return { status: status[name] };
  }

  private async _wrap(app: App): Promise<GetAppResponse> {
    return {
      name: app.name,
      buildpack: app.buildpack,
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
      createdAt: app.createdAt.getTime(),
      updatedAt: app.updatedAt.getTime(),
      extensions: app.extensions,
    };
  }

  private async _status(names: string[]) {
    const result: Record<string, StatusAppResponse["status"]> = {};

    for (const name of names) {
      let status: StatusAppResponse["status"] = "stopped";
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
      result[name] = status;
    }

    return result;
  }
}
