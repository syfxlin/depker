import { BadRequestException, Body, Controller, Get, Post, Put } from "@nestjs/common";
import { ListAppRequest, UpsertAppRequest } from "../views/app.view";
import { DockerService } from "../services/docker.service";
import { App } from "../entities/app.entity";
import { In } from "typeorm";
import { Port } from "../entities/port.entity";
import { Volume } from "../entities/volume.entity";
import { PortBind } from "../entities/port-bind.entity";
import { VolumeBind } from "../entities/volume-bind.entity";

@Controller("/apps")
export class AppController {
  constructor(private readonly docker: DockerService) {}

  @Get("/")
  public async list(request: ListAppRequest) {}

  @Post("/")
  @Put("/")
  public async upsert(@Body() request: UpsertAppRequest) {
    const app = new App();
    app.name = request.name;
    app.buildpack = { name: request.buildpack.name, values: request.buildpack.values };
    // web
    app.domain = request.domain;
    app.rule = request.rule;
    app.port = request.port;
    app.scheme = request.scheme;
    app.tls = request.tls;
    app.middlewares = request.middlewares
      ?.filter((v) => v.name && v.type)
      ?.map((v) => ({ name: v.name, type: v.type, options: v.options ?? {} }));
    // extensions
    app.commands = request.commands;
    app.entrypoints = request.entrypoints;
    app.restart = request.restart;
    app.pull = request.pull;
    app.healthcheck = request.healthcheck;
    app.init = request.init;
    app.rm = request.rm;
    app.privileged = request.privileged;
    app.user = request.user;
    app.workdir = request.workdir;
    // values
    app.buildArgs = request.buildArgs;
    app.networks = request.networks;
    app.labels = request.labels;
    app.secrets = request.secrets;
    app.hosts = request.hosts;
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
        bind.bind = maps.get(port.name);
        ports.push(bind);
      }
    }
    // volumes
    const volumes: VolumeBind[] = [];
    if (request.volumes && request.ports.length) {
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
        bind.bind = maps.get(volume.name);
        volumes.push(bind);
      }
    }

    // save app
    await App.save(app);
    // save ports or volumes
    if (ports.length) {
      await PortBind.upsert(
        ports.map((v) => {
          v.app = app;
          return v;
        }),
        ["app", "bind", "port"]
      );
    }
    if (volumes.length) {
      await VolumeBind.upsert(
        volumes.map((v) => {
          v.app = app;
          return v;
        }),
        ["app", "bind", "path"]
      );
    }
    return "OK";
  }
}
