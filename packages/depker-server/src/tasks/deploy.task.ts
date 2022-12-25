import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DeployService } from "../services/deploy.service";
import { holder } from "../utils/holder.util";

@Injectable()
export class DeployTask {
  private readonly deploys: DeployService;
  private readonly logger = new Logger(DeployTask.name);
  private readonly _deploy = holder();
  private readonly _job = holder();

  constructor(deploys: DeployService) {
    this.deploys = deploys;
  }

  @Cron("*/2 * * * * *")
  public async deploy() {
    await this._deploy(async () => {
      try {
        await this.deploys.deployTask();
      } catch (e: any) {
        this.logger.error(`Run deploy task failed. Caused by ${e.message}`, e.stack);
      }
    });
  }

  @Cron("*/2 * * * * *")
  public async job() {
    await this._job(async () => {
      try {
        await this.deploys.jobTask();
      } catch (e: any) {
        this.logger.error(`Run job task failed. Caused by ${e.message}`, e.stack);
      }
    });
  }

  @Cron("0 * * * * *")
  public async schedule() {
    try {
      await this.deploys.scheduleTask();
    } catch (e: any) {
      this.logger.error(`Run schedule task failed. Caused by ${e.message}`, e.stack);
    }
  }
}
