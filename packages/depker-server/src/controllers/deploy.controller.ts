import { Controller, Delete, Get, NotFoundException } from "@nestjs/common";
import { Data } from "../decorators/data.decorator";
import { Service } from "../entities/service.entity";
import { Deploy } from "../entities/deploy.entity";
import { ILike, MoreThanOrEqual } from "typeorm";
import { DeployLog } from "../entities/deploy-log.entity";
import { DateTime } from "luxon";
import {
  CancelServiceDeployRequest,
  CancelServiceDeployResponse,
  ListServiceDeployRequest,
  ListServiceDeployResponse,
  LogsServiceDeployRequest,
  LogsServiceDeployResponse,
} from "../views/deploy.view";

@Controller("/api/services/:name/deploys")
export class DeployController {
  @Get("/")
  public async list(@Data() request: ListServiceDeployRequest): Promise<ListServiceDeployResponse> {
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

  @Get("/:id/logs")
  public async logs(@Data() request: LogsServiceDeployRequest): Promise<LogsServiceDeployResponse> {
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

  @Delete("/:id/cancel")
  public async cancel(@Data() request: CancelServiceDeployRequest): Promise<CancelServiceDeployResponse> {
    const { id, name } = request;
    const count = await Deploy.countBy({ id, service: { name } });
    if (!count) {
      throw new NotFoundException(`Not found deploy of ${name}.`);
    }
    await Deploy.update(id, { status: "failed" });
    return { status: "success" };
  }
}
