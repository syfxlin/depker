import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Service } from "./service.entity";
import { DeployLog } from "./deploy-log.entity";
import { DateTime } from "luxon";
import { Logger } from "@nestjs/common";
import { DeployStatus, LogFunc, LogLevel } from "../types";

@Entity()
@Index(["status"])
export class Deploy extends BaseEntity {
  private static readonly _logger = new Logger("DEPLOY");

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  target: string;

  @Column({ nullable: false, default: "queued" })
  status: DeployStatus;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // service
  @ManyToOne(() => Service, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  service: Relation<Service>;

  // repository
  public get logger(): LogFunc {
    const upload = (level: LogLevel, message: string, error?: Error) => {
      const time = DateTime.utc().toJSDate();
      const line = message + (error ? `[ERROR] ${error.name}: ${error.message}, ${error.stack}` : ``);
      Deploy._logger.debug(`[${time.toISOString()}] ${level.toUpperCase()} ${this.service.name}:${this.id} : ${line}`);
      return DeployLog.insert(line.split("\n").map((i) => ({ deploy: this, time, level, line: i })));
    };
    return {
      debug: (line) => upload("debug", line),
      log: (line) => upload("log", line),
      step: (line) => upload("step", line),
      success: (line) => upload("success", line),
      error: (line, error) => upload("error", line, error),
      upload: (level, line, error) => upload(level, line, error),
    };
  }

  // method
  public get view() {
    return {
      id: this.id,
      service: this.service.name,
      target: this.target,
      status: this.status,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
