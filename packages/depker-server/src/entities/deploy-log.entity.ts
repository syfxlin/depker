import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Deploy } from "./deploy.entity";
import { LogLevel } from "../types";

@Entity()
@Index(["time"])
@Index(["level"])
export class DeployLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Deploy, {
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
