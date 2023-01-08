import { Controller, Delete, Get, Post, Put } from "@nestjs/common";
import { Data } from "../decorators/data.decorator";
import {
  CreateContainerRequest,
  CreateContainerResponse,
  DeleteContainerRequest,
  DeleteContainerResponse,
  ListContainerRequest,
  ListContainerResponse,
  OperateContainerRequest,
  OperateContainerResponse,
  RenameContainerRequest,
  RenameContainerResponse,
} from "../views/container.view";
import { DockerService } from "../services/docker.service";
import { AuthGuard } from "../guards/auth.guard";
import { ServiceStatus } from "../entities/service.entity";
import { IMAGES } from "../constants/depker.constant";

@Controller("/api/containers")
export class ContainerController {
  constructor(private readonly docker: DockerService) {}

  @Get("/")
  @AuthGuard()
  public async list(@Data() request: ListContainerRequest): Promise<ListContainerResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:desc" } = request;
    const infos = await this.docker.containers.list();

    const filtered = infos.filter((i) => {
      const lower = search.toLowerCase();
      if (!lower) {
        return true;
      }
      const fields = [i.Id, i.Names[0], i.Image, i.ImageID, i.State, i.Status];
      return fields.find((f) => f.toLowerCase().indexOf(lower) !== -1);
    });

    const total: ListContainerResponse["total"] = filtered.length;
    const items: ListContainerResponse["items"] = filtered
      .sort((left, right) => {
        const [by, order] = sort.toLowerCase().split(":");
        const a = order === "asc" ? left : right;
        const b = order === "asc" ? right : left;
        if (by === "id") {
          return a.Id.localeCompare(b.Id);
        }
        if (by === "name") {
          return a.Names[0].localeCompare(b.Names[0]);
        }
        if (by === "image") {
          return a.Image.localeCompare(b.Image);
        }
        if (by === "image_id") {
          return a.ImageID.localeCompare(b.ImageID);
        }
        if (by === "created") {
          return a.Created - b.Created;
        }
        if (by === "state") {
          return a.State.localeCompare(b.State);
        }
        if (by === "status") {
          return a.Status.localeCompare(b.Status);
        }
        return 0;
      })
      .slice(offset, offset + limit)
      .map((i) => ({
        id: i.Id,
        name: i.Names[0],
        image: i.Image,
        imageId: i.ImageID,
        command: i.Command,
        created: i.Created * 1000,
        state: i.State as ServiceStatus,
        status: i.Status,
        labels: i.Labels,
        networks: Object.entries(i.NetworkSettings.Networks).map(([name, network]) => ({
          id: network.NetworkID,
          name: name,
          mac: network.MacAddress,
          ipv4: network.IPAddress,
          ipv6: network.GlobalIPv6Address,
          aliases: network.Aliases ?? [],
        })),
        ports: i.Ports.map((port) => ({
          ip: port.IP,
          hport: port.PublicPort,
          cport: port.PrivatePort,
          type: port.Type,
        })),
        volumes: i.Mounts.map((volume) => ({
          type: volume.Type,
          hpath: volume.Source,
          cpath: volume.Destination,
          mode: volume.Mode,
          readonly: !volume.RW,
        })),
      }));

    return { total, items };
  }

  @Post("/:name")
  @AuthGuard()
  public async create(@Data() request: CreateContainerRequest): Promise<CreateContainerResponse> {
    request.commands = request.commands.trim().replace(/^docker\s+run\s+/, "");
    request.commands = `docker run -d --name=${request.name} ${request.commands}`;
    await this.docker.containers.run(IMAGES.DOCKER, [`sh`, `-c`, request.commands], undefined, {
      HostConfig: {
        AutoRemove: true,
        Binds: [`/var/run/docker.sock:/var/run/docker.sock`],
      },
    });
    return { status: "success" };
  }

  @Put("/:name")
  @AuthGuard()
  public async rename(@Data() request: RenameContainerRequest): Promise<RenameContainerResponse> {
    await this.docker.containers.rename(request.name, request.rename);
    return { status: "success" };
  }

  @Delete("/:name")
  @AuthGuard()
  public async delete(@Data() request: DeleteContainerRequest): Promise<DeleteContainerResponse> {
    await this.docker.containers.remove(request.name);
    return { status: "success" };
  }

  @Post("/:name/start")
  @AuthGuard()
  public async start(@Data() request: OperateContainerRequest): Promise<OperateContainerResponse> {
    await this.docker.containers.start(request.name);
    return { status: "success" };
  }

  @Post("/:name/restart")
  @AuthGuard()
  public async restart(@Data() request: OperateContainerRequest): Promise<OperateContainerResponse> {
    await this.docker.containers.restart(request.name);
    return { status: "success" };
  }

  @Post("/:name/stop")
  @AuthGuard()
  public async stop(@Data() request: OperateContainerRequest): Promise<OperateContainerResponse> {
    await this.docker.containers.stop(request.name);
    return { status: "success" };
  }

  @Post("/:name/kill")
  @AuthGuard()
  public async kill(@Data() request: OperateContainerRequest): Promise<OperateContainerResponse> {
    await this.docker.containers.kill(request.name);
    return { status: "success" };
  }
}
