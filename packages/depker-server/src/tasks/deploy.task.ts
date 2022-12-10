import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DeployService } from "../services/deploy.service";

@Injectable()
export class DeployTask {
  private readonly deploys: DeployService;
  private readonly logger = new Logger(DeployTask.name);
  private running = false;

  constructor(deploys: DeployService) {
    this.deploys = deploys;
  }

  @Cron("*/2 * * * * *")
  public async deploy() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.deploys.task1();
    } catch (e: any) {
      this.logger.error(`Run deploy task failed. Caused by ${e.message}`, e.stack);
    } finally {
      this.running = false;
    }
  }

  @Cron("0 * * * * *")
  public async schedule() {
    try {
      await this.deploys.task2();
    } catch (e: any) {
      this.logger.error(`Run schedule task failed. Caused by ${e.message}`, e.stack);
    }
  }
}
