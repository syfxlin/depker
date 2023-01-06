import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { LogLevel } from "../types";
import { Cron } from "./cron-history.entity";

@Entity()
@Index(["time"])
@Index(["level"])
export class CronLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // history
  @ManyToOne(() => Cron, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  history: Relation<Cron>;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  level: LogLevel;

  @Column({ nullable: false, type: "text" })
  line: string;
}
