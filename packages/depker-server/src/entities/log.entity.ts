import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Deploy } from "./deploy.entity";

export type DeployLogger = {
  debug: (line: string) => void;
  log: (line: string) => void;
  step: (line: string) => void;
  success: (line: string) => void;
  error: (line: string, error?: Error) => void;
};

export type LogLevel = "debug" | "log" | "step" | "success" | "error";

@Entity()
@Index(["time"])
@Index(["level"])
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Deploy, (deploy) => deploy.logs, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  deploy: Relation<Deploy>;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  level: LogLevel;

  @Column({ nullable: false, type: "text" })
  line: string;
}
