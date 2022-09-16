import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DeployService } from "../services/deploy.service";

@Injectable()
export class DeployTask {
  private readonly deploys: DeployService;
  private readonly logger = new Logger(DeployTask.name);
  private running = false;

  constructor(deploys: DeployService) {
    this.deploys = deploys;
  }

  @Interval(2000)
  public async interval() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.deploys.task();
    } catch (e: any) {
      this.logger.error(`Run deploy task failed. Caused by ${e.message}`, e.stack);
    } finally {
      this.running = false;
    }
  }
}
