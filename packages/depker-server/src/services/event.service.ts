import { Injectable, Logger } from "@nestjs/common";
import path from "path";
import { ServiceEvent } from "../events/service.event";
import { PATHS } from "../constants/depker.constant";
import { DockerService } from "./docker.service";
import { OnEvent } from "@nestjs/event-emitter";
import fs from "fs-extra";
import { Cron } from "../entities/cron.entity";
import { PortEvent } from "../events/port.event";
import { TraefikTask } from "../tasks/traefik.task";
import { SettingEvent } from "../events/setting.event";

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly docker: DockerService, private readonly traefik: TraefikTask) {}

  @OnEvent(ServiceEvent.DOWN)
  public async onServiceDown(name: string) {
    // delete cron
    try {
      await Cron.delete(name);
      this.logger.log(`Purge service ${name} schedule successful.`);
    } catch (e) {
      this.logger.error(`Purge service ${name} schedule failed.`, e);
    }
    // delete container
    try {
      await this.docker.getContainer(name).remove({ force: true });
      const infos = await this.docker.listContainers({ all: true });
      const containers = infos.filter((c) => c.Labels["depker.name"] === name);
      for (const info of containers) {
        const container = this.docker.getContainer(info.Id);
        try {
          await container.remove({ force: true });
        } catch (e: any) {
          if (e.statusCode === 404) {
            return;
          }
          this.logger.error(`Purge service ${name} container ${container.id} failed.`, e);
        }
      }
      this.logger.log(`Purge service ${name} container successful.`);
    } catch (e) {
      this.logger.error(`Purge service ${name} container failed.`, e);
    }
  }

  @OnEvent(ServiceEvent.DELETE)
  public async onServiceDelete(name: string) {
    // delete source
    try {
      await fs.remove(path.join(PATHS.REPOS, `${name}.git`));
      this.logger.log(`Purge service ${name} source successful.`);
    } catch (e) {
      this.logger.error(`Purge service ${name} source failed.`, e);
    }
    await this.onServiceDown(name);
  }

  @OnEvent(PortEvent.CREATE)
  public async onPortCreate() {
    try {
      await this.traefik.reload(true);
      this.logger.log(`Host port has been changed, restart traefik successful.`);
    } catch (e) {
      this.logger.error(`Host port has been changed, restart traefik failed.`, e);
    }
  }

  @OnEvent(PortEvent.DELETE)
  public async onPortDelete() {
    await this.onPortCreate();
  }

  @OnEvent(SettingEvent.UPDATE)
  public async onSettingUpdate() {
    try {
      await this.traefik.reload(true);
      this.logger.log(`Setting has been changed, restart traefik successful.`);
    } catch (e) {
      this.logger.error(`Setting has been changed, restart traefik failed.`, e);
    }
  }
}
