import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuildLog } from "../entities/build-log.entity";
import { Build } from "../entities/build.entity";

@Injectable()
export class BuildLogService {
  private readonly logger = new Logger(BuildLogService.name);

  constructor(
    @InjectRepository(BuildLog)
    private readonly repository: Repository<BuildLog>
  ) {}

  public async log(build: Build, line: string) {
    const time = new Date();
    // prettier-ignore
    this.logger.debug(`build log, build: ${build.id}, time: ${time.toISOString()}, line: ${line}`);
    return this.repository.insert({
      build,
      time,
      line,
    });
  }
}
