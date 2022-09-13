import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeployLog } from "../entities/deploy-log.entity";
import { Deploy } from "../entities/deploy.entity";

@Injectable()
export class DeployLogService {
  private readonly logger = new Logger("DEPLOY");

  constructor(
    @InjectRepository(DeployLog)
    private readonly repository: Repository<DeployLog>
  ) {}

  public async insert(deploy: Deploy, level: DeployLog["level"], line: string) {
    const time = new Date();
    this.logger.debug(`[${time.toISOString()}] ${level.toUpperCase()} ${deploy.id} : ${line}`);
    return this.repository.insert({ deploy, time, line });
  }

  public async debug(deploy: Deploy, line: string) {
    return this.insert(deploy, "debug", line);
  }

  public async log(deploy: Deploy, line: string) {
    return this.insert(deploy, "log", line);
  }

  public async step(deploy: Deploy, line: string) {
    return this.insert(deploy, "step", line);
  }

  public async succeed(deploy: Deploy, line: string) {
    return this.insert(deploy, "succeed", line);
  }

  public async failed(deploy: Deploy, line: string) {
    return this.insert(deploy, "failed", line);
  }
}
