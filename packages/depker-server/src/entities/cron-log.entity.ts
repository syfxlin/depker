import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { LogLevel } from "../types";
import { CronHistory } from "./cron-history.entity";

@Entity()
@Index(["time"])
@Index(["level"])
export class CronLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // history
  @ManyToOne(() => CronHistory, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  history: Relation<CronHistory>;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  level: LogLevel;

  @Column({ nullable: false, type: "text" })
  line: string;
}
