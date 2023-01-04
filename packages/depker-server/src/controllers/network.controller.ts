import { Controller, Delete, Get, Post } from "@nestjs/common";
import { DockerService } from "../services/docker.service";
import { Data } from "../decorators/data.decorator";
import {
  ConnectNetworkRequest,
  ConnectNetworkResponse,
  CreateNetworkRequest,
  CreateNetworkResponse,
  DeleteNetworkRequest,
  DeleteNetworkResponse,
  DisconnectNetworkRequest,
  DisconnectNetworkResponse,
  ListNetworkRequest,
  ListNetworkResponse,
} from "../views/network.view";
import { NetworkInspectInfo } from "dockerode";
import { DateTime } from "luxon";

@Controller("/api/networks")
export class NetworkController {
  constructor(private readonly docker: DockerService) {}

  @Get("/")
  public async list(@Data() request: ListNetworkRequest): Promise<ListNetworkResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:desc" } = request;
    const infos = await this.docker.networks.list();
    const networks = await Promise.all(
      infos.map((i) => this.docker.networks.get(i.Id).inspect() as Promise<NetworkInspectInfo>)
    );

    const total: ListNetworkResponse["total"] = networks.length;
    const items: ListNetworkResponse["items"] = networks
      .filter((i) => {
        const lower = search.toLowerCase();
        if (!lower) {
          return true;
        }
        if (i.Name.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        if (i.Id.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        if (i.Scope.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        if (i.Driver.toLowerCase().indexOf(lower) !== -1) {
          return true;
        }
        return false;
      })
      .sort((left, right) => {
        const [by, order] = sort.toLowerCase().split(":");
        const a = order === "asc" ? left : right;
        const b = order === "asc" ? right : left;
        if (by === "name") {
          return a.Name.localeCompare(b.Name);
        }
        if (by === "id") {
          return a.Id.localeCompare(b.Id);
        }
        if (by === "scope") {
          return a.Scope.localeCompare(b.Scope);
        }
        if (by === "driver") {
          return a.Driver.localeCompare(b.Driver);
        }
        return 0;
      })
      .slice(offset, offset + limit)
      .map((i) => ({
        name: i.Name,
        id: i.Id,
        scope: i.Scope,
        driver: i.Driver,
        ipv6: i.EnableIPv6,
        created: DateTime.fromISO(i.Created).valueOf(),
        ips: (i.IPAM?.Config ?? []).map((c) => ({
          gateway: c.Gateway,
          subnet: c.Subnet,
        })),
        containers: Object.entries(i.Containers ?? {}).map(([id, container]) => ({
          id: id,
          name: container.Name,
          mac: container.MacAddress,
          ipv4: container.IPv4Address,
          ipv6: container.IPv6Address,
        })),
      }));

    return { total, items };
  }

  @Post("/:name")
  public async create(@Data() request: CreateNetworkRequest): Promise<CreateNetworkResponse> {
    await this.docker.networks.create(request.name);
    return { status: "success" };
  }

  @Delete("/:name")
  public async delete(@Data() request: DeleteNetworkRequest): Promise<DeleteNetworkResponse> {
    await this.docker.networks.remove(request.name);
    return { status: "success" };
  }

  @Post("/:name/connect/:container")
  public async connect(@Data() request: ConnectNetworkRequest): Promise<ConnectNetworkResponse> {
    await this.docker.networks.connect(request.name, request.container);
    return { status: "success" };
  }

  @Delete("/:name/disconnect/:container")
  public async disconnect(@Data() request: DisconnectNetworkRequest): Promise<DisconnectNetworkResponse> {
    await this.docker.networks.disconnect(request.name, request.container);
    return { status: "success" };
  }
}
