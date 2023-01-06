import { Controller, Delete, Get, NotFoundException } from "@nestjs/common";
import { Data } from "../decorators/data.decorator";
import {
  CancelServiceCronRequest,
  CancelServiceCronResponse,
  ListServiceCronRequest,
  ListServiceCronResponse,
  LogsServiceCronRequest,
  LogsServiceCronResponse,
} from "../views/cron.view";
import { Service } from "../entities/service.entity";
import { ILike, MoreThanOrEqual } from "typeorm";
import { Cron } from "../entities/cron.entity";
import { DateTime } from "luxon";
import { CronLog } from "../entities/cron-log.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CronEvent } from "../events/cron.event";

@Controller("/api/services/:name/crons")
export class CronController {
  constructor(private readonly events: EventEmitter2) {}

  @Get("/")
  public async list(@Data() request: ListServiceCronRequest): Promise<ListServiceCronResponse> {
    const { name, search = "", offset = 0, limit = 10, sort = "id:desc" } = request;
    const [by, axis] = sort.split(":");
    const exist = await Service.countBy({ name: request.name });
    if (!exist) {
      throw new NotFoundException(`Not found service of ${request.name}.`);
    }

    const [crons, count] = await Cron.findAndCount({
      where: {
        service: { name },
        status: search ? (ILike(`%${search}%`) as any) : undefined,
      },
      relations: { service: true },
      skip: offset,
      take: limit,
      order: { [by]: axis ? axis : "asc" },
    });

    const total: ListServiceCronResponse["total"] = count;
    const items: ListServiceCronResponse["items"] = crons.map((d) => d.view);

    return { total, items };
  }

  @Get("/:id/logs")
  public async logs(@Data() request: LogsServiceCronRequest): Promise<LogsServiceCronResponse> {
    const { id, name, since, tail } = request;
    const cron = await Cron.findOneBy({ id, service: { name } });
    if (!cron) {
      throw new NotFoundException(`Not found cron of ${name}.`);
    }

    const lines = await CronLog.find({
      where: {
        history: { id },
        time: typeof since === "number" ? MoreThanOrEqual(DateTime.fromMillis(since).toJSDate()) : undefined,
      },
      take: typeof tail === "number" ? tail : undefined,
      order: { id: "desc" },
    });

    lines.reverse();

    const logs: LogsServiceCronResponse["logs"] = lines.map((i) => [i.level, i.time.getTime(), i.line]);
    if (["success", "failed"].includes(cron!.status)) {
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
  public async cancel(@Data() request: CancelServiceCronRequest): Promise<CancelServiceCronResponse> {
    const { id, name } = request;
    const count = await Cron.countBy({ id, service: { name } });
    if (!count) {
      throw new NotFoundException(`Not found cron of ${name}.`);
    }

    // update status
    await Cron.update(id, { status: "failed" });

    // emit event
    await this.events.emitAsync(CronEvent.CANCEL, name, id);

    return { status: "success" };
  }
}
