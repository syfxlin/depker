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
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/networks")
export class NetworkController {
  constructor(private readonly docker: DockerService) {}

  @Get("/")
  @AuthGuard()
  public async list(@Data() request: ListNetworkRequest): Promise<ListNetworkResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:desc" } = request;
    const infos = await this.docker.networks.list();

    const filtered = infos.filter((i) => {
      const lower = search.toLowerCase();
      if (!lower) {
        return true;
      }
      const fields = [i.Name, i.Id, i.Scope, i.Driver];
      return fields.find((f) => f.toLowerCase().indexOf(lower) !== -1);
    });

    const total: ListNetworkResponse["total"] = filtered.length;
    const items: ListNetworkResponse["items"] = await Promise.all(
      filtered
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
        .map(async (item) => {
          const inspect: NetworkInspectInfo = await this.docker.networks.get(item.Id).inspect();
          return {
            name: inspect.Name,
            id: inspect.Id,
            scope: inspect.Scope,
            driver: inspect.Driver,
            ipv6: inspect.EnableIPv6,
            created: DateTime.fromISO(inspect.Created).valueOf(),
            ips: (inspect.IPAM?.Config ?? []).map((c) => ({
              gateway: c.Gateway,
              subnet: c.Subnet,
            })),
            containers: Object.entries(inspect.Containers ?? {}).map(([id, container]) => ({
              id: id,
              name: container.Name,
              mac: container.MacAddress,
              ipv4: container.IPv4Address,
              ipv6: container.IPv6Address,
            })),
          };
        })
    );

    return { total, items };
  }

  @Post("/:name")
  @AuthGuard()
  public async create(@Data() request: CreateNetworkRequest): Promise<CreateNetworkResponse> {
    await this.docker.networks.create(request.name);
    return { status: "success" };
  }

  @Delete("/:name")
  @AuthGuard()
  public async delete(@Data() request: DeleteNetworkRequest): Promise<DeleteNetworkResponse> {
    await this.docker.networks.remove(request.name);
    return { status: "success" };
  }

  @Post("/:name/connect/:container")
  @AuthGuard()
  public async connect(@Data() request: ConnectNetworkRequest): Promise<ConnectNetworkResponse> {
    await this.docker.networks.connect(request.name, request.container);
    return { status: "success" };
  }

  @Delete("/:name/disconnect/:container")
  @AuthGuard()
  public async disconnect(@Data() request: DisconnectNetworkRequest): Promise<DisconnectNetworkResponse> {
    await this.docker.networks.disconnect(request.name, request.container);
    return { status: "success" };
  }
}
