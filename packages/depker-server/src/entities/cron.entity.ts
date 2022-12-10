import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Service } from "../types";

@Entity()
export class Cron extends BaseEntity {
  @PrimaryColumn()
  serviceName: string;

  // service
  @ManyToOne(() => Service, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  service: Relation<Service>;

  // options
  @Column({ nullable: false })
  time: string;

  @Column({ nullable: true, type: "simple-json" })
  options: any;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
