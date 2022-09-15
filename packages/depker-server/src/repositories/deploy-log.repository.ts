import { Injectable, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { DeployLog } from "../entities/deploy-log.entity";
import { Deploy } from "../entities/deploy.entity";

@Injectable()
export class DeployLogRepository extends Repository<DeployLog> {
  private readonly logger = new Logger("DEPLOY");

  constructor(private dataSource: DataSource) {
    super(DeployLog, dataSource.createEntityManager());
  }

  public async upload(deploy: Deploy, level: DeployLog["level"], line: string) {
    const time = new Date();
    this.logger.debug(`[${time.toISOString()}] ${level.toUpperCase()} ${deploy.app.name}:${deploy.id} : ${line}`);
    return this.insert({ deploy, time, level, line });
  }

  public async debug(deploy: Deploy, line: string) {
    return this.upload(deploy, "debug", line);
  }

  public async log(deploy: Deploy, line: string) {
    return this.upload(deploy, "log", line);
  }

  public async step(deploy: Deploy, line: string) {
    return this.upload(deploy, "step", line);
  }

  public async succeed(deploy: Deploy, line: string) {
    return this.upload(deploy, "succeed", line);
  }

  public async failed(deploy: Deploy, line: string, error?: Error) {
    if (error) {
      line += `[ERROR] ${error.name}: ${error.message}, ${error.stack}`;
    }
    return this.upload(deploy, "failed", line);
  }
}
