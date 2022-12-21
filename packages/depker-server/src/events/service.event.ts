import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DockerService } from "../services/docker.service";
import fs from "fs-extra";
import path from "path";
import { PATHS } from "../constants/depker.constant";
import { Cron } from "../entities/cron.entity";

export enum ServiceEventName {
  DOWN = "service.down",
  DELETE = "service.delete",
}

@Injectable()
export class ServiceEvent {
  private readonly logger = new Logger(ServiceEvent.name);

  constructor(private readonly docker: DockerService) {}

  @OnEvent(ServiceEventName.DOWN)
  public async onDown(name: string) {
    this.logger.log(`Event of service.down [${name}] is received, execution operation started.`);
    // delete cron
    await this.deleteCron(name);
    // delete container
    await this.deleteContainer(name);
  }

  @OnEvent(ServiceEventName.DELETE)
  public async onDelete(name: string) {
    this.logger.log(`Event of service.delete [${name}] is received, execution operation started.`);
    // delete source
    try {
      await fs.remove(path.join(PATHS.REPOS, `${name}.git`));
      this.logger.log(`Purge service ${name} source successful.`);
    } catch (e) {
      this.logger.error(`Purge service ${name} source failed.`, e);
    }
    // delete cron
    await this.deleteCron(name);
    // delete container
    await this.deleteContainer(name);
  }

  private async deleteCron(name: string) {
    try {
      await Cron.delete(name);
      this.logger.log(`Purge service ${name} schedule successful.`);
    } catch (e) {
      this.logger.error(`Purge service ${name} schedule failed.`, e);
    }
  }

  private async deleteContainer(name: string) {
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
}
