import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Deploy } from "./deploy.entity";
import { Logger } from "@nestjs/common";

export type DeployLogger = ReturnType<typeof Log["logger"]>;

@Entity()
@Index(["time"])
@Index(["level"])
export class Log extends BaseEntity {
  private static readonly _logger = new Logger("DEPLOY");

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Deploy, (deploy) => deploy.logs, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  deploy: Relation<Deploy>;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  level: "debug" | "log" | "step" | "succeed" | "failed";

  @Column({ nullable: false, type: "text" })
  line: string;

  // repository
  public static async upload(deploy: Deploy, level: Log["level"], line: string) {
    const time = new Date();
    Log._logger.debug(`[${time.toISOString()}] ${level.toUpperCase()} ${deploy.app.name}:${deploy.id} : ${line}`);
    return this.insert({ deploy, time, level, line });
  }

  public static async debug(deploy: Deploy, line: string) {
    return Log.upload(deploy, "debug", line);
  }

  public static async log(deploy: Deploy, line: string) {
    return Log.upload(deploy, "log", line);
  }

  public static async step(deploy: Deploy, line: string) {
    return Log.upload(deploy, "step", line);
  }

  public static async succeed(deploy: Deploy, line: string) {
    return Log.upload(deploy, "succeed", line);
  }

  public static async failed(deploy: Deploy, line: string, error?: Error) {
    if (error) {
      line += `[ERROR] ${error.name}: ${error.message}, ${error.stack}`;
    }
    return Log.upload(deploy, "failed", line);
  }

  public static logger(deploy: Deploy) {
    return {
      debug: (line: string) => Log.debug(deploy, line),
      log: (line: string) => Log.log(deploy, line),
      step: (line: string) => Log.step(deploy, line),
      succeed: (line: string) => Log.succeed(deploy, line),
      failed: (line: string, error?: Error) => Log.failed(deploy, line, error),
    };
  }
}
