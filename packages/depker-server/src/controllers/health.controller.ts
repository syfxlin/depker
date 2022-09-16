import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus";

@Controller("/healthcheck")
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly database: TypeOrmHealthIndicator) {}

  @Get()
  @HealthCheck()
  public healthcheck() {
    return this.health.check([() => this.database.pingCheck("database")]);
  }
}
