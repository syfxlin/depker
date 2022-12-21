import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Logger } from "@nestjs/common";
import { DeployStatus, LogFunc, LogLevel, Service } from "../types";
import { DateTime } from "luxon";
import { CronLog } from "./cron-log.entity";

@Entity()
export class CronHistory extends BaseEntity {
  private static readonly _logger = new Logger("CRON");

  @PrimaryGeneratedColumn()
  id: number;

  // service
  @ManyToOne(() => Service, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  service: Relation<Service>;

  @Column({ nullable: false, default: "queued" })
  status: DeployStatus;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // repository
  public get logger(): LogFunc {
    const upload = (level: LogLevel, message: string, error?: Error) => {
      const time = DateTime.utc().toJSDate();
      const line = message + (error ? `[ERROR] ${error.name}: ${error.message}, ${error.stack}` : ``);
      CronHistory._logger.debug(`[${time.toISOString()}] ${level.toUpperCase()} ${this.service.name} : ${line}`);
      return CronLog.insert({ history: this, time, level, line });
    };
    return {
      debug: (line: string) => upload("debug", line),
      log: (line: string) => upload("log", line),
      step: (line: string) => upload("step", line),
      success: (line: string) => upload("success", line),
      error: (line: string, error?: Error) => upload("error", line, error),
    };
  }

  // method
  public get view() {
    return {
      id: this.id,
      service: this.service.name,
      cron: this.service.extensions.cron,
      status: this.status,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
