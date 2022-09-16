import { Controller, Get, NotFoundException, Query, StreamableFile } from "@nestjs/common";
import s, { Systeminformation } from "systeminformation";
import pjson from "../../package.json" assert { type: "json" };
import { HttpService } from "nestjs-http-promise";
import { PATHS, URLS } from "../constants/depker.constant";
// @ts-ignore
import parser from "parse-prometheus-text-format";
import path from "path";
import fs from "fs-extra";
import { readLastLinesEnc } from "read-last-lines-ts";
import { LogsRequest, LogsResponse, MetricsResponse, VersionResponse } from "../views/info.view";
import TimeData = Systeminformation.TimeData;
import MemData = Systeminformation.MemData;
import CurrentLoadData = Systeminformation.CurrentLoadData;
import FsSizeData = Systeminformation.FsSizeData;

@Controller("/infos")
export class InfoController {
  constructor(private readonly http: HttpService) {}

  @Get("/version")
  public version(): VersionResponse {
    return {
      name: pjson.name,
      description: pjson.description,
      version: pjson.version,
    };
  }

  @Get("/metrics")
  public async metrics(): Promise<MetricsResponse> {
    const [time, memory, load, disk, traefik]: [TimeData, MemData, CurrentLoadData, FsSizeData[], any] =
      await Promise.all([
        s.time(),
        s.mem(),
        s.currentLoad(),
        s.fsSize(),
        this.http
          .get(`${URLS.TRAEFIK}/metrics`)
          .then((response) => parser(response.data).reduce((a: any, i: any) => ({ ...a, [i.name]: i.metrics }), {})),
      ]);
    return {
      time: {
        current: time.current,
        timezone: time.timezoneName,
        uptime: time.uptime,
      },
      cpu: {
        free: load.rawCurrentLoadIdle,
        used: load.rawCurrentLoad,
        total: load.rawCurrentLoadIdle + load.rawCurrentLoad,
      },
      memory: {
        free: memory.free,
        used: memory.used,
        total: memory.total,
      },
      swap: {
        free: memory.swapfree,
        used: memory.swapused,
        total: memory.swaptotal,
      },
      disk: disk.map((i) => ({
        name: i.fs,
        type: i.type,
        free: i.size - i.used,
        used: i.used,
        total: i.size,
      })),
      traefik: {
        reload: {
          last_success: parseFloat(traefik.traefik_config_last_reload_success?.[0]?.value ?? 0) * 1000,
          last_failure: parseFloat(traefik.traefik_config_last_reload_failure?.[0]?.value ?? 0) * 1000,
          total_success: parseInt(traefik.traefik_config_reloads_total?.[0]?.value ?? 0),
          total_failure: parseInt(traefik.traefik_config_reloads_failure_total?.[0]?.value ?? 0),
        },
        connections: (traefik.traefik_entrypoint_open_connections ?? [])
          .filter((i: any) => i.labels.entrypoint !== "traefik")
          .reduce(
            (a: any, i: any) => ({
              ...a,
              [i.labels.entrypoint]: (a[i.labels.entrypoint] ?? 0) + parseInt(i.value),
            }),
            {}
          ),
        requests: (traefik.traefik_entrypoint_requests_total ?? [])
          .filter((i: any) => i.labels.entrypoint !== "traefik")
          .reduce(
            (a: any, i: any) => ({
              ...a,
              [i.labels.code]: (a[i.labels.code] ?? 0) + parseInt(i.value),
            }),
            {}
          ),
        certs: (traefik.traefik_tls_certs_not_after ?? []).reduce(
          (a: any, i: any) => ({
            ...a,
            [i.labels.cn]: parseFloat(i.value) * 1000,
          }),
          {}
        ),
      },
    };
  }

  @Get("/logs")
  public async logs(@Query() request: LogsRequest): Promise<LogsResponse | StreamableFile> {
    const file = path.join(PATHS.CONFIG, "traefik-access.log");
    const exist = fs.pathExistsSync(file);
    if (!request.download) {
      if (!exist) {
        return [];
      }
      return readLastLinesEnc("utf-8")(file, Math.max(1, request.lines)).split("\n");
    } else {
      if (!exist) {
        throw new NotFoundException("Not found access-log files, may not have been generated.");
      }
      return new StreamableFile(fs.createReadStream(file, "utf-8"), {
        disposition: `attachment; filename="access-log.log"`,
      });
    }
  }
}
